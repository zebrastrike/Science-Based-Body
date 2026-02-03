# Science Based Body - Database Schema Design

## Architecture Overview

This schema implements a **first-party data capture system** designed for:
- Viral e-commerce with bursty traffic patterns
- Manual payment workflows (Zelle/CashApp) as first-class citizens
- Future Epicor Propello ERP integration without schema rewrites
- Full auditability and compliance traceability

### Core Principles

1. **Orders ≠ Payments**: An order represents intent; a payment represents money movement
2. **Explicit over implicit**: No magic fields, all states are enumerated
3. **Write-optimized**: Designed for high concurrency with proper indexing
4. **Audit everything**: Status history tables for all state transitions
5. **ERP-ready**: Clean sync boundaries for Epicor Propello

---

## Section 1: Core User & Authentication Schema

```sql
-- =============================================================================
-- ENUMS (Preferred over lookup tables for fixed, small sets)
-- =============================================================================

CREATE TYPE user_role AS ENUM ('customer', 'wholesale', 'admin', 'super_admin');
CREATE TYPE user_status AS ENUM ('pending_verification', 'active', 'suspended', 'banned', 'deleted');
CREATE TYPE auth_provider AS ENUM ('email', 'google', 'apple');
CREATE TYPE session_status AS ENUM ('active', 'expired', 'revoked');

-- =============================================================================
-- USERS TABLE
-- =============================================================================
-- Core identity table. Minimal fields - extended via user_profiles.
-- This table syncs to Epicor Propello as "Customer Master"

CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    email               VARCHAR(255) NOT NULL,
    email_verified      BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified_at   TIMESTAMPTZ,
    phone               VARCHAR(20),
    phone_verified      BOOLEAN NOT NULL DEFAULT FALSE,

    -- Authentication
    password_hash       VARCHAR(255),  -- NULL if OAuth-only
    auth_provider       auth_provider NOT NULL DEFAULT 'email',

    -- Status & Role
    role                user_role NOT NULL DEFAULT 'customer',
    status              user_status NOT NULL DEFAULT 'pending_verification',

    -- Compliance (Required for peptide sales)
    age_verified        BOOLEAN NOT NULL DEFAULT FALSE,
    age_verified_at     TIMESTAMPTZ,
    kyc_status          VARCHAR(20) DEFAULT 'not_required',  -- not_required, pending, approved, rejected
    kyc_verified_at     TIMESTAMPTZ,

    -- ERP Integration
    erp_customer_id     VARCHAR(50),  -- Epicor Propello Customer ID (populated on sync)
    erp_synced_at       TIMESTAMPTZ,

    -- Timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,  -- Soft delete for compliance

    -- Constraints
    CONSTRAINT users_email_unique UNIQUE (email),
    CONSTRAINT users_phone_unique UNIQUE (phone) WHERE phone IS NOT NULL
);

-- Indexes for high-read operations
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_erp_sync ON users(erp_synced_at) WHERE erp_customer_id IS NULL;
CREATE INDEX idx_users_created ON users(created_at DESC);

-- =============================================================================
-- USER PROFILES TABLE
-- =============================================================================
-- Extended user information. Separating from users keeps auth queries fast.

CREATE TABLE user_profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Personal Info
    first_name          VARCHAR(100),
    last_name           VARCHAR(100),
    display_name        VARCHAR(100),
    date_of_birth       DATE,  -- Required for age verification

    -- Preferences
    preferred_currency  VARCHAR(3) DEFAULT 'USD',
    timezone            VARCHAR(50) DEFAULT 'America/New_York',
    locale              VARCHAR(10) DEFAULT 'en-US',

    -- Marketing
    marketing_consent   BOOLEAN NOT NULL DEFAULT FALSE,
    marketing_consent_at TIMESTAMPTZ,
    sms_consent         BOOLEAN NOT NULL DEFAULT FALSE,
    sms_consent_at      TIMESTAMPTZ,

    -- Attribution (captured at registration)
    utm_source          VARCHAR(100),
    utm_medium          VARCHAR(100),
    utm_campaign        VARCHAR(100),
    utm_term            VARCHAR(100),
    utm_content         VARCHAR(100),
    referrer_url        TEXT,
    landing_page        TEXT,

    -- Timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT user_profiles_user_unique UNIQUE (user_id)
);

CREATE INDEX idx_user_profiles_user ON user_profiles(user_id);

-- =============================================================================
-- AUTH SESSIONS TABLE
-- =============================================================================
-- JWT refresh tokens and session management

CREATE TABLE auth_sessions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Token Info
    refresh_token_hash  VARCHAR(255) NOT NULL,  -- Hashed, never store raw

    -- Session Metadata
    status              session_status NOT NULL DEFAULT 'active',
    ip_address          INET,
    user_agent          TEXT,
    device_fingerprint  VARCHAR(255),

    -- Expiration
    expires_at          TIMESTAMPTZ NOT NULL,
    last_used_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Revocation
    revoked_at          TIMESTAMPTZ,
    revoked_reason      VARCHAR(100),

    -- Timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT auth_sessions_token_unique UNIQUE (refresh_token_hash)
);

-- Indexes for session validation (hot path)
CREATE INDEX idx_auth_sessions_user ON auth_sessions(user_id) WHERE status = 'active';
CREATE INDEX idx_auth_sessions_expires ON auth_sessions(expires_at) WHERE status = 'active';
CREATE INDEX idx_auth_sessions_cleanup ON auth_sessions(status, expires_at);

-- =============================================================================
-- USER ADDRESSES TABLE
-- =============================================================================
-- Separate table for multiple addresses per user

CREATE TABLE user_addresses (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Address Type
    address_type        VARCHAR(20) NOT NULL DEFAULT 'shipping',  -- shipping, billing
    is_default          BOOLEAN NOT NULL DEFAULT FALSE,

    -- Address Fields
    label               VARCHAR(50),  -- "Home", "Office", etc.
    recipient_name      VARCHAR(200) NOT NULL,
    company             VARCHAR(200),
    street_line_1       VARCHAR(255) NOT NULL,
    street_line_2       VARCHAR(255),
    city                VARCHAR(100) NOT NULL,
    state_province      VARCHAR(100) NOT NULL,
    postal_code         VARCHAR(20) NOT NULL,
    country_code        CHAR(2) NOT NULL DEFAULT 'US',
    phone               VARCHAR(20),

    -- Validation
    validated           BOOLEAN NOT NULL DEFAULT FALSE,
    validated_at        TIMESTAMPTZ,
    validation_source   VARCHAR(50),  -- 'shippo', 'manual', etc.

    -- Timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_user_addresses_user ON user_addresses(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_addresses_default ON user_addresses(user_id, address_type, is_default)
    WHERE deleted_at IS NULL AND is_default = TRUE;
```

### Why This Design

1. **users vs user_profiles separation**: Auth queries (login, token validation) only hit `users`. Profile data is rarely needed in hot paths.

2. **Soft deletes**: Compliance requires we never hard-delete user data. The `deleted_at` pattern with partial indexes keeps queries fast.

3. **ERP fields on users**: `erp_customer_id` and `erp_synced_at` are the integration boundary. Epicor Propello will read from here.

4. **Attribution at registration**: UTM params captured once and never modified. This is your source of truth for CAC analysis.

---

## Section 2: Product & Inventory Schema

```sql
-- =============================================================================
-- PRODUCT ENUMS
-- =============================================================================

CREATE TYPE product_status AS ENUM ('draft', 'active', 'discontinued', 'out_of_stock');
CREATE TYPE product_type AS ENUM ('peptide', 'kit', 'accessory', 'bundle');

-- =============================================================================
-- PRODUCTS TABLE
-- =============================================================================
-- This table syncs to Epicor Propello as "Item Master"

CREATE TABLE products (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    sku                 VARCHAR(50) NOT NULL,
    name                VARCHAR(255) NOT NULL,
    slug                VARCHAR(255) NOT NULL,

    -- Classification
    product_type        product_type NOT NULL DEFAULT 'peptide',
    status              product_status NOT NULL DEFAULT 'draft',

    -- Pricing (in cents to avoid float issues)
    price_cents         INTEGER NOT NULL,
    compare_at_cents    INTEGER,  -- Original price for sales
    cost_cents          INTEGER,  -- COGS for margin calculation

    -- Inventory
    track_inventory     BOOLEAN NOT NULL DEFAULT TRUE,
    quantity_on_hand    INTEGER NOT NULL DEFAULT 0,
    quantity_reserved   INTEGER NOT NULL DEFAULT 0,  -- In carts/pending orders
    low_stock_threshold INTEGER DEFAULT 10,

    -- Physical
    weight_grams        INTEGER,

    -- Content (minimal - frontend handles display)
    short_description   TEXT,

    -- Compliance (CRITICAL for peptides)
    requires_age_verification BOOLEAN NOT NULL DEFAULT TRUE,
    requires_kyc        BOOLEAN NOT NULL DEFAULT FALSE,
    restricted_states   TEXT[],  -- Array of state codes where product can't ship
    restricted_countries TEXT[] DEFAULT ARRAY['CA', 'AU', 'UK'],

    -- COA (Certificate of Analysis)
    current_batch_number VARCHAR(50),
    current_coa_url     TEXT,

    -- ERP Integration
    erp_item_id         VARCHAR(50),  -- Epicor Propello Item ID
    erp_synced_at       TIMESTAMPTZ,

    -- Timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at        TIMESTAMPTZ,
    deleted_at          TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT products_sku_unique UNIQUE (sku),
    CONSTRAINT products_slug_unique UNIQUE (slug),
    CONSTRAINT products_price_positive CHECK (price_cents > 0)
);

CREATE INDEX idx_products_status ON products(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_type ON products(product_type, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_erp_sync ON products(erp_synced_at) WHERE erp_item_id IS NULL;

-- =============================================================================
-- PRODUCT CATEGORIES TABLE
-- =============================================================================
-- Lookup table for flexible categorization

CREATE TABLE product_categories (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(100) NOT NULL,
    slug                VARCHAR(100) NOT NULL,
    description         TEXT,
    parent_id           UUID REFERENCES product_categories(id),
    sort_order          INTEGER NOT NULL DEFAULT 0,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT product_categories_slug_unique UNIQUE (slug)
);

-- Junction table for many-to-many
CREATE TABLE product_category_assignments (
    product_id          UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id         UUID NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
    is_primary          BOOLEAN NOT NULL DEFAULT FALSE,

    PRIMARY KEY (product_id, category_id)
);

CREATE INDEX idx_product_categories_parent ON product_categories(parent_id);
CREATE INDEX idx_pca_category ON product_category_assignments(category_id);

-- =============================================================================
-- PRODUCT BATCHES TABLE
-- =============================================================================
-- Track batches for COA compliance

CREATE TABLE product_batches (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id          UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    batch_number        VARCHAR(50) NOT NULL,
    quantity_produced   INTEGER NOT NULL,
    quantity_remaining  INTEGER NOT NULL,

    -- COA
    coa_file_url        TEXT NOT NULL,
    coa_verified        BOOLEAN NOT NULL DEFAULT FALSE,
    coa_verified_by     UUID REFERENCES users(id),
    coa_verified_at     TIMESTAMPTZ,

    -- Dates
    manufactured_at     DATE NOT NULL,
    expires_at          DATE NOT NULL,

    -- Status
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT product_batches_number_unique UNIQUE (product_id, batch_number)
);

CREATE INDEX idx_product_batches_product ON product_batches(product_id) WHERE is_active = TRUE;
CREATE INDEX idx_product_batches_expiry ON product_batches(expires_at) WHERE is_active = TRUE;
```

---

## Section 3: Cart Schema

```sql
-- =============================================================================
-- CARTS TABLE
-- =============================================================================
-- Supports both anonymous and authenticated carts

CREATE TABLE carts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Owner (one of these will be set)
    user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
    anonymous_id        VARCHAR(100),  -- Browser fingerprint or session ID

    -- Status
    status              VARCHAR(20) NOT NULL DEFAULT 'active',  -- active, merged, converted, abandoned

    -- Totals (cached, recalculated on item change)
    subtotal_cents      INTEGER NOT NULL DEFAULT 0,
    discount_cents      INTEGER NOT NULL DEFAULT 0,
    tax_cents           INTEGER NOT NULL DEFAULT 0,
    total_cents         INTEGER NOT NULL DEFAULT 0,

    -- Discount
    discount_code       VARCHAR(50),
    discount_id         UUID,

    -- Shipping Address (for rate calculation)
    shipping_address_id UUID REFERENCES user_addresses(id),

    -- Conversion Tracking
    converted_to_order_id UUID,  -- Set when cart becomes order
    converted_at        TIMESTAMPTZ,

    -- Attribution (captured at cart creation)
    utm_source          VARCHAR(100),
    utm_medium          VARCHAR(100),
    utm_campaign        VARCHAR(100),
    referrer_url        TEXT,

    -- Timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at          TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Only one active cart per user
CREATE UNIQUE INDEX idx_carts_user_active ON carts(user_id)
    WHERE user_id IS NOT NULL AND status = 'active';

CREATE INDEX idx_carts_anonymous ON carts(anonymous_id)
    WHERE anonymous_id IS NOT NULL AND status = 'active';

CREATE INDEX idx_carts_abandoned ON carts(status, updated_at)
    WHERE status = 'active';

-- =============================================================================
-- CART ITEMS TABLE
-- =============================================================================

CREATE TABLE cart_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id             UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id          UUID NOT NULL REFERENCES products(id),

    -- Quantity
    quantity            INTEGER NOT NULL DEFAULT 1,

    -- Price at time of add (prices can change)
    unit_price_cents    INTEGER NOT NULL,

    -- Timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT cart_items_quantity_positive CHECK (quantity > 0),
    CONSTRAINT cart_items_unique UNIQUE (cart_id, product_id)
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);
```

### Cart to User Merge Flow

When anonymous user logs in:
1. Find cart by `anonymous_id`
2. If user has existing cart, merge items (sum quantities)
3. Set old cart `status = 'merged'`
4. Transfer `anonymous_id` cart items to user cart

---

## Section 4: Order Schema (Decoupled from Payments)

```sql
-- =============================================================================
-- ORDER ENUMS
-- =============================================================================

CREATE TYPE order_status AS ENUM (
    'pending_payment',      -- Order created, awaiting payment
    'payment_received',     -- Payment confirmed (manual or automated)
    'processing',           -- Being prepared
    'ready_to_ship',        -- Packed, awaiting carrier pickup
    'shipped',              -- In transit
    'delivered',            -- Confirmed delivered
    'cancelled',            -- Cancelled before fulfillment
    'refunded',             -- Fully refunded
    'partially_refunded'    -- Partially refunded
);

-- =============================================================================
-- ORDERS TABLE
-- =============================================================================
-- An order represents INTENT TO PURCHASE. Payment is tracked separately.
-- This table syncs to Epicor Propello as "Sales Order"

CREATE TABLE orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Human-readable order number (for customer communication)
    order_number        VARCHAR(20) NOT NULL,

    -- Customer
    user_id             UUID NOT NULL REFERENCES users(id),
    customer_email      VARCHAR(255) NOT NULL,  -- Denormalized for quick access
    customer_name       VARCHAR(200) NOT NULL,

    -- Status
    status              order_status NOT NULL DEFAULT 'pending_payment',

    -- Addresses (copied, not referenced - addresses can change)
    shipping_address    JSONB NOT NULL,
    billing_address     JSONB NOT NULL,

    -- Totals (in cents)
    subtotal_cents      INTEGER NOT NULL,
    discount_cents      INTEGER NOT NULL DEFAULT 0,
    shipping_cents      INTEGER NOT NULL DEFAULT 0,
    tax_cents           INTEGER NOT NULL DEFAULT 0,
    total_cents         INTEGER NOT NULL,

    -- Payment Summary (derived from payments table)
    amount_paid_cents   INTEGER NOT NULL DEFAULT 0,
    amount_due_cents    INTEGER GENERATED ALWAYS AS (total_cents - amount_paid_cents) STORED,

    -- Discount
    discount_code       VARCHAR(50),
    discount_id         UUID,

    -- Shipping
    shipping_method     VARCHAR(50),
    shipping_carrier    VARCHAR(50),
    tracking_number     VARCHAR(100),
    estimated_delivery  DATE,

    -- Compliance (CRITICAL)
    age_verified        BOOLEAN NOT NULL DEFAULT FALSE,
    compliance_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    compliance_version  VARCHAR(20) NOT NULL,
    compliance_acknowledged_at TIMESTAMPTZ NOT NULL,
    ip_address          INET,

    -- Source
    source_cart_id      UUID REFERENCES carts(id),

    -- Attribution
    utm_source          VARCHAR(100),
    utm_medium          VARCHAR(100),
    utm_campaign        VARCHAR(100),

    -- Notes
    customer_notes      TEXT,
    internal_notes      TEXT,

    -- ERP Integration
    erp_order_id        VARCHAR(50),  -- Epicor Propello Sales Order ID
    erp_synced_at       TIMESTAMPTZ,

    -- Timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at             TIMESTAMPTZ,
    shipped_at          TIMESTAMPTZ,
    delivered_at        TIMESTAMPTZ,
    cancelled_at        TIMESTAMPTZ,

    CONSTRAINT orders_number_unique UNIQUE (order_number),
    CONSTRAINT orders_total_positive CHECK (total_cents > 0)
);

-- Indexes for common queries
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_pending_payment ON orders(status, created_at)
    WHERE status = 'pending_payment';
CREATE INDEX idx_orders_erp_sync ON orders(erp_synced_at)
    WHERE erp_order_id IS NULL AND status != 'cancelled';

-- =============================================================================
-- ORDER ITEMS TABLE
-- =============================================================================

CREATE TABLE order_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id          UUID NOT NULL REFERENCES products(id),

    -- Snapshot at time of order (products can change)
    product_sku         VARCHAR(50) NOT NULL,
    product_name        VARCHAR(255) NOT NULL,

    -- Quantity & Price
    quantity            INTEGER NOT NULL,
    unit_price_cents    INTEGER NOT NULL,
    subtotal_cents      INTEGER GENERATED ALWAYS AS (quantity * unit_price_cents) STORED,

    -- Batch tracking (for COA compliance)
    batch_id            UUID REFERENCES product_batches(id),
    batch_number        VARCHAR(50),

    -- Fulfillment
    quantity_fulfilled  INTEGER NOT NULL DEFAULT 0,
    quantity_refunded   INTEGER NOT NULL DEFAULT 0,

    -- ERP
    erp_line_id         VARCHAR(50),

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT order_items_quantity_positive CHECK (quantity > 0)
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- =============================================================================
-- ORDER STATUS HISTORY TABLE
-- =============================================================================
-- Full audit trail of every status change

CREATE TABLE order_status_history (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

    -- Status Change
    from_status         order_status,
    to_status           order_status NOT NULL,

    -- Context
    reason              TEXT,
    changed_by          UUID REFERENCES users(id),  -- NULL if system
    changed_by_type     VARCHAR(20) NOT NULL DEFAULT 'system',  -- system, admin, customer, webhook

    -- Metadata
    metadata            JSONB,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_status_history_order ON order_status_history(order_id);
CREATE INDEX idx_order_status_history_created ON order_status_history(created_at DESC);
```

### Why Orders ≠ Payments

| Aspect | Order | Payment |
|--------|-------|---------|
| Represents | Intent to purchase | Money movement |
| Created when | Checkout completed | Payment initiated |
| Can exist without | Payment (pending state) | Never alone |
| Status changes | Business workflow | Financial reconciliation |
| ERP sync | Sales Order | Payment/Receipt |

An order can have:
- Zero payments (abandoned/cancelled)
- One payment (normal flow)
- Multiple payments (partial payments, split tender)
- Payment > order total (overpayment, refund needed)

---

## Section 5: Payment Model (CRITICAL)

```sql
-- =============================================================================
-- PAYMENT ENUMS
-- =============================================================================

CREATE TYPE payment_status AS ENUM (
    'pending',              -- Awaiting confirmation
    'awaiting_verification', -- Manual payment submitted, needs admin review
    'processing',           -- Being processed by provider
    'completed',            -- Successfully received
    'failed',               -- Payment failed
    'cancelled',            -- Cancelled by user
    'refunded',             -- Fully refunded
    'partially_refunded',   -- Partially refunded
    'expired'               -- Payment window expired
);

CREATE TYPE payment_method_type AS ENUM (
    'zelle',
    'cashapp',
    'venmo',
    'wire_transfer',
    'check',
    'crypto',
    'erp_propello',         -- Future: Epicor Propello managed
    'manual_other'
);

-- =============================================================================
-- PAYMENT METHODS TABLE
-- =============================================================================
-- Configured payment methods (admin-managed)

CREATE TABLE payment_methods (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    method_type         payment_method_type NOT NULL,
    name                VARCHAR(100) NOT NULL,  -- Display name

    -- Configuration
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    is_manual           BOOLEAN NOT NULL DEFAULT TRUE,  -- Requires admin confirmation

    -- Instructions (shown to customer)
    instructions        TEXT NOT NULL,

    -- Payment Details (where to send money)
    payment_details     JSONB NOT NULL,
    /*
    Example for Zelle:
    {
        "email": "payments@sciencebasedbody.com",
        "recipient_name": "Science Based Body LLC"
    }

    Example for CashApp:
    {
        "cashtag": "$ScienceBasedBody",
        "qr_code_url": "https://..."
    }
    */

    -- Limits
    min_amount_cents    INTEGER DEFAULT 0,
    max_amount_cents    INTEGER,

    -- Timing
    confirmation_window_hours INTEGER DEFAULT 48,  -- How long to wait for payment

    -- Display
    sort_order          INTEGER NOT NULL DEFAULT 0,
    icon_url            TEXT,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_active ON payment_methods(is_active, sort_order);

-- =============================================================================
-- PAYMENTS TABLE
-- =============================================================================
-- Actual payment transactions

CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Reference number (for customer/admin communication)
    payment_reference   VARCHAR(30) NOT NULL,

    -- Links
    order_id            UUID NOT NULL REFERENCES orders(id),
    user_id             UUID NOT NULL REFERENCES users(id),
    payment_method_id   UUID NOT NULL REFERENCES payment_methods(id),

    -- Amount
    amount_cents        INTEGER NOT NULL,
    currency            VARCHAR(3) NOT NULL DEFAULT 'USD',

    -- Status
    status              payment_status NOT NULL DEFAULT 'pending',

    -- For manual payments: customer-provided proof
    customer_reference  VARCHAR(100),  -- Their transaction ID/confirmation
    proof_file_url      TEXT,          -- Screenshot/receipt upload
    customer_notes      TEXT,

    -- Admin verification
    verified_by         UUID REFERENCES users(id),
    verified_at         TIMESTAMPTZ,
    verification_notes  TEXT,

    -- Refund tracking
    refunded_amount_cents INTEGER NOT NULL DEFAULT 0,

    -- ERP Integration
    erp_payment_id      VARCHAR(50),  -- Epicor Propello Payment ID
    erp_synced_at       TIMESTAMPTZ,

    -- Metadata
    metadata            JSONB,
    ip_address          INET,

    -- Timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at          TIMESTAMPTZ,  -- When pending payment expires
    completed_at        TIMESTAMPTZ,
    failed_at           TIMESTAMPTZ,

    CONSTRAINT payments_reference_unique UNIQUE (payment_reference),
    CONSTRAINT payments_amount_positive CHECK (amount_cents > 0)
);

-- Indexes
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_pending ON payments(status, expires_at)
    WHERE status IN ('pending', 'awaiting_verification');
CREATE INDEX idx_payments_reference ON payments(payment_reference);
CREATE INDEX idx_payments_erp_sync ON payments(erp_synced_at)
    WHERE erp_payment_id IS NULL AND status = 'completed';

-- =============================================================================
-- PAYMENT ATTEMPTS TABLE
-- =============================================================================
-- Every attempt to make a payment (for audit and debugging)

CREATE TABLE payment_attempts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id          UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,

    -- Attempt details
    attempt_number      INTEGER NOT NULL DEFAULT 1,
    status              VARCHAR(20) NOT NULL,  -- initiated, submitted, verified, failed

    -- What happened
    action              VARCHAR(50) NOT NULL,  -- 'customer_submit', 'admin_verify', 'admin_reject', 'auto_expire'
    performed_by        UUID REFERENCES users(id),
    performed_by_type   VARCHAR(20) NOT NULL,  -- customer, admin, system

    -- Result
    success             BOOLEAN NOT NULL,
    failure_reason      TEXT,

    -- Metadata
    request_data        JSONB,  -- What was submitted
    response_data       JSONB,  -- What came back (if external)

    ip_address          INET,
    user_agent          TEXT,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_attempts_payment ON payment_attempts(payment_id);
CREATE INDEX idx_payment_attempts_created ON payment_attempts(created_at DESC);

-- =============================================================================
-- REFUNDS TABLE
-- =============================================================================

CREATE TABLE refunds (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    refund_reference    VARCHAR(30) NOT NULL,

    -- Links
    payment_id          UUID NOT NULL REFERENCES payments(id),
    order_id            UUID NOT NULL REFERENCES orders(id),

    -- Amount
    amount_cents        INTEGER NOT NULL,

    -- Status
    status              VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, completed, failed

    -- Reason
    reason              VARCHAR(100) NOT NULL,
    reason_details      TEXT,

    -- Processing
    processed_by        UUID REFERENCES users(id),
    processed_at        TIMESTAMPTZ,

    -- How refund was issued
    refund_method       VARCHAR(50),  -- original_method, store_credit, check, etc.
    refund_details      JSONB,

    -- ERP
    erp_refund_id       VARCHAR(50),
    erp_synced_at       TIMESTAMPTZ,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT refunds_reference_unique UNIQUE (refund_reference),
    CONSTRAINT refunds_amount_positive CHECK (amount_cents > 0)
);

CREATE INDEX idx_refunds_payment ON refunds(payment_id);
CREATE INDEX idx_refunds_order ON refunds(order_id);
CREATE INDEX idx_refunds_status ON refunds(status);
```

### Manual Payment Reconciliation Flow

```
1. Customer completes checkout
   → Order created (status: pending_payment)
   → Payment created (status: pending)
   → Customer shown payment instructions

2. Customer sends money (Zelle/CashApp)
   → Customer uploads proof/reference
   → Payment updated (status: awaiting_verification)
   → Payment attempt logged

3. Admin reviews
   → Views payment proof
   → Checks bank/CashApp for received funds
   → IF verified:
      → Payment updated (status: completed)
      → Order.amount_paid_cents updated
      → IF fully paid: Order status → payment_received
      → Payment attempt logged (action: admin_verify)
   → IF rejected:
      → Payment updated (status: failed)
      → Payment attempt logged (action: admin_reject, failure_reason: "...")

4. Expiration (cron job)
   → Payments pending > confirmation_window_hours
   → Payment updated (status: expired)
   → Order remains pending_payment (can create new payment)
```

---

## Section 6: Fulfillment Schema

```sql
-- =============================================================================
-- FULFILLMENT STATUS ENUM
-- =============================================================================

CREATE TYPE fulfillment_status AS ENUM (
    'unfulfilled',
    'partially_fulfilled',
    'fulfilled',
    'returned',
    'partially_returned'
);

-- =============================================================================
-- FULFILLMENTS TABLE
-- =============================================================================
-- A fulfillment is a shipment. One order can have multiple fulfillments.

CREATE TABLE fulfillments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    fulfillment_number  VARCHAR(20) NOT NULL,

    order_id            UUID NOT NULL REFERENCES orders(id),

    -- Status
    status              fulfillment_status NOT NULL DEFAULT 'unfulfilled',

    -- Shipping
    carrier             VARCHAR(50),
    service_level       VARCHAR(50),
    tracking_number     VARCHAR(100),
    tracking_url        TEXT,

    -- Shippo Integration
    shippo_shipment_id  VARCHAR(100),
    shippo_rate_id      VARCHAR(100),
    shippo_label_url    TEXT,
    shipping_cost_cents INTEGER,

    -- Address (snapshot)
    shipping_address    JSONB NOT NULL,

    -- Dates
    shipped_at          TIMESTAMPTZ,
    estimated_delivery  DATE,
    delivered_at        TIMESTAMPTZ,

    -- ERP
    erp_shipment_id     VARCHAR(50),
    erp_synced_at       TIMESTAMPTZ,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fulfillments_number_unique UNIQUE (fulfillment_number)
);

CREATE INDEX idx_fulfillments_order ON fulfillments(order_id);
CREATE INDEX idx_fulfillments_tracking ON fulfillments(tracking_number);
CREATE INDEX idx_fulfillments_status ON fulfillments(status);

-- =============================================================================
-- FULFILLMENT ITEMS TABLE
-- =============================================================================

CREATE TABLE fulfillment_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fulfillment_id      UUID NOT NULL REFERENCES fulfillments(id) ON DELETE CASCADE,
    order_item_id       UUID NOT NULL REFERENCES order_items(id),

    quantity            INTEGER NOT NULL,

    -- Batch for this specific fulfillment
    batch_id            UUID REFERENCES product_batches(id),
    batch_number        VARCHAR(50),

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fulfillment_items_fulfillment ON fulfillment_items(fulfillment_id);
CREATE INDEX idx_fulfillment_items_order_item ON fulfillment_items(order_item_id);

-- =============================================================================
-- FULFILLMENT STATUS HISTORY TABLE
-- =============================================================================

CREATE TABLE fulfillment_status_history (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fulfillment_id      UUID NOT NULL REFERENCES fulfillments(id) ON DELETE CASCADE,

    from_status         fulfillment_status,
    to_status           fulfillment_status NOT NULL,

    reason              TEXT,
    changed_by          UUID REFERENCES users(id),

    -- Carrier tracking event
    carrier_status      VARCHAR(100),
    carrier_timestamp   TIMESTAMPTZ,
    location            VARCHAR(200),

    metadata            JSONB,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fulfillment_status_history_fulfillment ON fulfillment_status_history(fulfillment_id);
```

---

## Section 7: Event Tracking & Attribution

```sql
-- =============================================================================
-- EVENTS TABLE
-- =============================================================================
-- First-party behavioral event tracking

CREATE TABLE events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Event Identity
    event_name          VARCHAR(100) NOT NULL,
    event_category      VARCHAR(50) NOT NULL,  -- page, user, cart, checkout, order, system

    -- Actor (one of these will be set)
    user_id             UUID REFERENCES users(id),
    anonymous_id        VARCHAR(100),
    session_id          VARCHAR(100),

    -- Context
    page_url            TEXT,
    page_title          VARCHAR(255),
    referrer_url        TEXT,

    -- Attribution (captured with every event)
    utm_source          VARCHAR(100),
    utm_medium          VARCHAR(100),
    utm_campaign        VARCHAR(100),
    utm_term            VARCHAR(100),
    utm_content         VARCHAR(100),

    -- Associated Entities
    product_id          UUID,
    cart_id             UUID,
    order_id            UUID,
    payment_id          UUID,

    -- Event Data (flexible payload)
    properties          JSONB NOT NULL DEFAULT '{}',

    -- Client Info
    ip_address          INET,
    user_agent          TEXT,
    device_type         VARCHAR(20),  -- desktop, mobile, tablet
    browser             VARCHAR(50),
    os                  VARCHAR(50),
    screen_resolution   VARCHAR(20),

    -- Geo (derived from IP)
    country_code        CHAR(2),
    region              VARCHAR(100),
    city                VARCHAR(100),

    -- Timestamps
    client_timestamp    TIMESTAMPTZ,  -- When event occurred on client
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()  -- When received by server
);

-- Partitioning by month for performance (events table gets big)
-- In production, use: PARTITION BY RANGE (created_at)

-- Indexes optimized for analytics queries
CREATE INDEX idx_events_name ON events(event_name);
CREATE INDEX idx_events_category ON events(event_category);
CREATE INDEX idx_events_user ON events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_events_anonymous ON events(anonymous_id) WHERE anonymous_id IS NOT NULL;
CREATE INDEX idx_events_session ON events(session_id);
CREATE INDEX idx_events_created ON events(created_at DESC);
CREATE INDEX idx_events_order ON events(order_id) WHERE order_id IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX idx_events_user_name ON events(user_id, event_name, created_at DESC);
CREATE INDEX idx_events_attribution ON events(utm_source, utm_campaign, created_at DESC);
```

### Event Naming Convention

```
{category}.{action}[.{detail}]

Examples:
- page.view
- page.scroll.50
- page.scroll.100
- user.signup.started
- user.signup.completed
- user.login.success
- user.login.failed
- product.view
- product.quick_view
- cart.add
- cart.remove
- cart.update_quantity
- checkout.started
- checkout.step.shipping
- checkout.step.payment
- checkout.compliance.acknowledged
- checkout.completed
- order.created
- payment.initiated
- payment.proof_uploaded
- payment.completed
```

### Required vs Optional Fields

| Field | Required | Notes |
|-------|----------|-------|
| event_name | Yes | Always |
| event_category | Yes | Always |
| user_id OR anonymous_id | Yes | One must be set |
| session_id | Yes | For session stitching |
| created_at | Yes | Auto-generated |
| properties | Yes | Empty object `{}` if none |
| page_url | No | For page events |
| utm_* | No | When present in URL |
| product_id | No | For product events |
| order_id | No | For order events |

### Linking Anonymous to Authenticated

When user logs in:

```sql
-- Update all events from this anonymous session to the user
UPDATE events
SET user_id = :user_id
WHERE anonymous_id = :anonymous_id
  AND user_id IS NULL
  AND created_at > NOW() - INTERVAL '30 days';
```

---

## Section 8: Webhook Inbox (Future ERP Integration)

```sql
-- =============================================================================
-- WEBHOOKS INBOX TABLE
-- =============================================================================
-- Receives and stores all inbound webhooks before processing
-- Critical for Epicor Propello integration

CREATE TABLE webhooks_inbox (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Source
    source              VARCHAR(50) NOT NULL,  -- 'epicor_propello', 'shippo', 'mailgun', etc.
    webhook_type        VARCHAR(100) NOT NULL,  -- Event type from provider

    -- Processing
    status              VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, processing, completed, failed, skipped
    attempts            INTEGER NOT NULL DEFAULT 0,
    max_attempts        INTEGER NOT NULL DEFAULT 3,

    -- Payload
    headers             JSONB NOT NULL,
    payload             JSONB NOT NULL,

    -- Validation
    signature           VARCHAR(255),
    signature_valid     BOOLEAN,

    -- Processing Results
    processed_at        TIMESTAMPTZ,
    error_message       TEXT,
    result              JSONB,

    -- Related Entities (populated during processing)
    related_order_id    UUID,
    related_payment_id  UUID,
    related_fulfillment_id UUID,

    -- Timestamps
    received_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhooks_inbox_status ON webhooks_inbox(status, source);
CREATE INDEX idx_webhooks_inbox_pending ON webhooks_inbox(status, created_at)
    WHERE status IN ('pending', 'failed');
CREATE INDEX idx_webhooks_inbox_source ON webhooks_inbox(source, webhook_type);
CREATE INDEX idx_webhooks_inbox_received ON webhooks_inbox(received_at DESC);

-- =============================================================================
-- WEBHOOKS OUTBOX TABLE
-- =============================================================================
-- Outbound webhooks/notifications (for external systems, internal events)

CREATE TABLE webhooks_outbox (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Destination
    destination         VARCHAR(100) NOT NULL,  -- 'epicor_propello', 'internal_email', etc.
    endpoint_url        TEXT,

    -- Event
    event_type          VARCHAR(100) NOT NULL,

    -- Payload
    payload             JSONB NOT NULL,

    -- Processing
    status              VARCHAR(20) NOT NULL DEFAULT 'pending',
    attempts            INTEGER NOT NULL DEFAULT 0,
    max_attempts        INTEGER NOT NULL DEFAULT 3,

    -- Results
    last_attempt_at     TIMESTAMPTZ,
    response_status     INTEGER,
    response_body       TEXT,
    error_message       TEXT,

    -- Related Entity
    entity_type         VARCHAR(50),  -- 'order', 'payment', 'user'
    entity_id           UUID,

    -- Scheduling
    scheduled_for       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhooks_outbox_pending ON webhooks_outbox(status, scheduled_for)
    WHERE status IN ('pending', 'failed');
CREATE INDEX idx_webhooks_outbox_entity ON webhooks_outbox(entity_type, entity_id);
```

---

## Section 9: Audit & Admin Tables

```sql
-- =============================================================================
-- AUDIT LOG TABLE
-- =============================================================================
-- Comprehensive audit trail for compliance

CREATE TABLE audit_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Actor
    user_id             UUID REFERENCES users(id),
    user_email          VARCHAR(255),
    user_role           user_role,

    -- Action
    action              VARCHAR(100) NOT NULL,
    resource_type       VARCHAR(50) NOT NULL,
    resource_id         UUID,

    -- Change Details
    old_values          JSONB,
    new_values          JSONB,

    -- Context
    ip_address          INET,
    user_agent          TEXT,
    request_id          VARCHAR(100),

    -- Result
    success             BOOLEAN NOT NULL DEFAULT TRUE,
    error_message       TEXT,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partitioning recommended for production
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- =============================================================================
-- DISCOUNTS TABLE
-- =============================================================================

CREATE TABLE discounts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code                VARCHAR(50) NOT NULL,
    name                VARCHAR(100) NOT NULL,

    -- Type
    discount_type       VARCHAR(20) NOT NULL,  -- percentage, fixed_amount
    value               INTEGER NOT NULL,  -- Percentage (1-100) or cents

    -- Constraints
    minimum_order_cents INTEGER,
    maximum_discount_cents INTEGER,

    -- Usage
    usage_limit         INTEGER,  -- NULL = unlimited
    usage_count         INTEGER NOT NULL DEFAULT 0,
    usage_limit_per_user INTEGER DEFAULT 1,

    -- Validity
    starts_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at          TIMESTAMPTZ,

    -- Targeting
    product_ids         UUID[],  -- NULL = all products
    user_ids            UUID[],  -- NULL = all users
    first_order_only    BOOLEAN NOT NULL DEFAULT FALSE,

    -- Status
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT discounts_code_unique UNIQUE (code)
);

CREATE INDEX idx_discounts_code ON discounts(code) WHERE is_active = TRUE;
CREATE INDEX idx_discounts_active ON discounts(is_active, starts_at, expires_at);
```

---

## Section 10: Epicor Propello Integration Boundary

### Tables That Sync TO Epicor Propello (Outbound)

| Local Table | Epicor Entity | Sync Trigger |
|-------------|---------------|--------------|
| users | Customer Master | On user create, profile update |
| products | Item Master | On product create/update |
| orders | Sales Order | On order status = payment_received |
| payments | Payment/Receipt | On payment status = completed |
| fulfillments | Shipment | On fulfillment created |
| refunds | Credit Memo | On refund completed |

### Tables That Sync FROM Epicor Propello (Inbound via Webhook)

| Epicor Entity | Updates | Local Action |
|---------------|---------|--------------|
| Inventory | quantity_on_hand | Update products table |
| Payment Receipt | confirmation | Update payment status |
| Shipment Tracking | carrier updates | Update fulfillment |
| Customer | credit limit, terms | Update user metadata |

### Tables That NEVER Sync (First-Party Only)

- `events` - Behavioral data, not ERP-relevant
- `carts` / `cart_items` - Pre-order intent
- `auth_sessions` - Security, not business data
- `audit_logs` - Internal compliance
- `webhooks_inbox` / `webhooks_outbox` - Integration plumbing
- `payment_attempts` - Debugging data
- `order_status_history` - Internal audit
- `fulfillment_status_history` - Internal tracking

### ERP ID Fields

Every table that syncs has:
- `erp_{entity}_id` - The Epicor Propello ID after sync
- `erp_synced_at` - Last sync timestamp

This allows:
1. Idempotent sync (check if already synced)
2. Resync on demand (set `erp_synced_at = NULL`)
3. Sync status queries (WHERE `erp_*_id IS NULL`)

---

## Section 11: Database Seeding Strategy

### Seed Order (Dependencies)

```
1. payment_methods       (no dependencies)
2. product_categories    (no dependencies)
3. products              (no dependencies)
4. product_batches       (requires products)
5. users                 (no dependencies)
6. user_profiles         (requires users)
7. user_addresses        (requires users)
8. discounts             (no dependencies)
```

### Idempotent Seeding Approach

```sql
-- Use ON CONFLICT for idempotent seeds
INSERT INTO payment_methods (id, method_type, name, instructions, payment_details)
VALUES
    ('pm_zelle_001', 'zelle', 'Zelle', 'Send payment to...', '{"email": "..."}')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    instructions = EXCLUDED.instructions,
    payment_details = EXCLUDED.payment_details,
    updated_at = NOW();
```

### Environment-Specific Seeds

```
seeds/
├── base/                    # All environments
│   ├── 001_payment_methods.sql
│   ├── 002_product_categories.sql
│   └── 003_order_statuses.sql
├── development/             # Local dev only
│   ├── 010_test_users.sql
│   ├── 011_test_products.sql
│   └── 012_test_orders.sql
├── staging/                 # Staging only
│   └── 010_staging_users.sql
└── production/              # Production bootstrap
    └── 001_admin_user.sql
```

### Example Seed Data

See separate file: `DATABASE-SEED-DATA.sql`

---

## Section 12: Index Strategy Summary

### High-Read Hot Paths

| Query Pattern | Table | Index |
|---------------|-------|-------|
| Login by email | users | `idx_users_email` |
| Session validation | auth_sessions | `idx_auth_sessions_user` |
| Product listing | products | `idx_products_status` |
| Cart lookup | carts | `idx_carts_user_active` |
| Order history | orders | `idx_orders_user` |
| Order by number | orders | `idx_orders_number` |

### Admin Dashboard Queries

| Query Pattern | Table | Index |
|---------------|-------|-------|
| Pending payments | payments | `idx_payments_pending` |
| Orders by status | orders | `idx_orders_status` |
| Recent orders | orders | `idx_orders_created` |
| User search | users | Full-text or application-level |

### Background Job Queries

| Query Pattern | Table | Index |
|---------------|-------|-------|
| Expired payments | payments | `idx_payments_pending` |
| Abandoned carts | carts | `idx_carts_abandoned` |
| ERP sync queue | orders, payments | `idx_*_erp_sync` |
| Webhook retry | webhooks_inbox | `idx_webhooks_inbox_pending` |

### Write-Heavy Considerations

1. **events table**:
   - Most writes, partition by month
   - Indexes only on query-critical columns
   - Consider TimescaleDB for time-series optimization

2. **audit_logs table**:
   - High write volume
   - Partition by month
   - Minimal indexes (write performance > read)

3. **Avoid over-indexing**:
   - Each index = write overhead
   - Only index columns used in WHERE/JOIN/ORDER BY
