-- =============================================================================
-- SCIENCE BASED BODY - BASE SEED DATA
-- =============================================================================
-- This seed runs in ALL environments (local, staging, production)
-- Uses ON CONFLICT for idempotency - safe to run multiple times
-- =============================================================================

-- =============================================================================
-- 1. PAYMENT METHODS
-- =============================================================================

INSERT INTO payment_methods (id, method_type, name, is_active, is_manual, instructions, payment_details, min_amount_cents, max_amount_cents, confirmation_window_hours, sort_order)
VALUES
    -- Zelle
    (
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        'zelle',
        'Zelle',
        TRUE,
        TRUE,
        E'Send payment via Zelle to the email below. Include your order number in the memo.\n\n**Important:** Payment must be received within 48 hours or your order will be cancelled.',
        '{
            "email": "payments@sciencebasedbody.com",
            "recipient_name": "Science Based Body LLC",
            "qr_code_url": null
        }'::jsonb,
        0,
        500000,  -- $5,000 max
        48,
        1
    ),
    -- CashApp
    (
        'f47ac10b-58cc-4372-a567-0e02b2c3d480',
        'cashapp',
        'Cash App',
        TRUE,
        TRUE,
        E'Send payment via Cash App to the $Cashtag below. Include your order number in the note.\n\n**Important:** Payment must be received within 48 hours or your order will be cancelled.',
        '{
            "cashtag": "$ScienceBasedBody",
            "qr_code_url": null
        }'::jsonb,
        0,
        250000,  -- $2,500 max
        48,
        2
    ),
    -- Venmo
    (
        'f47ac10b-58cc-4372-a567-0e02b2c3d481',
        'venmo',
        'Venmo',
        FALSE,  -- Disabled by default
        TRUE,
        E'Send payment via Venmo to @ScienceBasedBody. Include your order number in the note.',
        '{
            "username": "@ScienceBasedBody",
            "qr_code_url": null
        }'::jsonb,
        0,
        100000,  -- $1,000 max
        48,
        3
    ),
    -- Wire Transfer
    (
        'f47ac10b-58cc-4372-a567-0e02b2c3d482',
        'wire_transfer',
        'Wire Transfer',
        TRUE,
        TRUE,
        E'For orders over $5,000, wire transfer is available. Contact support@sciencebasedbody.com for wire instructions.\n\n**Note:** International wires may take 3-5 business days to process.',
        '{
            "bank_name": "Contact for details",
            "routing_number": "Contact for details",
            "account_number": "Contact for details",
            "swift_code": "Contact for details"
        }'::jsonb,
        500000,  -- $5,000 minimum
        NULL,    -- No max
        120,     -- 5 days
        4
    ),
    -- Future: Epicor Propello
    (
        'f47ac10b-58cc-4372-a567-0e02b2c3d483',
        'erp_propello',
        'Credit Card (Epicor)',
        FALSE,  -- Disabled until integration
        FALSE,  -- Automated
        'Pay securely with credit or debit card.',
        '{
            "provider": "epicor_propello",
            "enabled": false
        }'::jsonb,
        0,
        NULL,
        1,  -- Instant
        0   -- First when enabled
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    is_active = EXCLUDED.is_active,
    instructions = EXCLUDED.instructions,
    payment_details = EXCLUDED.payment_details,
    updated_at = NOW();

-- =============================================================================
-- 2. PRODUCT CATEGORIES
-- =============================================================================

INSERT INTO product_categories (id, name, slug, description, parent_id, sort_order)
VALUES
    -- Top-level categories
    ('cat_weight_001', 'Weight Management', 'weight-management', 'Peptides researched for metabolic and weight-related pathways', NULL, 1),
    ('cat_muscle_001', 'Muscle & Recovery', 'muscle-recovery', 'Peptides researched for tissue repair and anabolic pathways', NULL, 2),
    ('cat_aging_001', 'Anti-Aging & Longevity', 'anti-aging-longevity', 'Peptides researched for cellular health and regeneration', NULL, 3),
    ('cat_cognitive_001', 'Cognitive Enhancement', 'cognitive-enhancement', 'Peptides researched for neuroprotective and cognitive pathways', NULL, 4),
    ('cat_skin_001', 'Skin & Beauty', 'skin-beauty', 'Peptides researched for collagen and cosmetic applications', NULL, 5),
    ('cat_immune_001', 'Immune Support', 'immune-support', 'Peptides researched for immune modulation', NULL, 6),
    ('cat_sexual_001', 'Sexual Health', 'sexual-health', 'Peptides researched for libido and hormone pathways', NULL, 7),
    ('cat_sleep_001', 'Sleep & Relaxation', 'sleep-relaxation', 'Peptides researched for sleep quality and stress response', NULL, 8),
    ('cat_kits_001', 'Research Kits', 'research-kits', 'Complete kits for research applications', NULL, 9),
    ('cat_accessories_001', 'Accessories', 'accessories', 'Research supplies and accessories', NULL, 10)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

-- =============================================================================
-- 3. COMPLIANCE CHECKBOX VERSIONS
-- =============================================================================
-- Stored as a reference table for audit compliance

CREATE TABLE IF NOT EXISTS compliance_versions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version             VARCHAR(20) NOT NULL UNIQUE,
    checkboxes          JSONB NOT NULL,
    effective_from      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO compliance_versions (id, version, checkboxes, effective_from)
VALUES
    (
        'cv_v1_001',
        '1.0.0',
        '[
            {
                "id": "research_purpose",
                "label": "I confirm all products are for research purposes only",
                "required": true
            },
            {
                "id": "age_verification",
                "label": "I confirm I am 21 years of age or older",
                "required": true
            },
            {
                "id": "no_medical_use",
                "label": "I understand these products are not for human consumption",
                "required": true
            },
            {
                "id": "responsibility",
                "label": "I accept full responsibility for proper handling and storage",
                "required": true
            },
            {
                "id": "terms_acceptance",
                "label": "I have read and agree to the Terms of Service and Privacy Policy",
                "required": true
            }
        ]'::jsonb,
        '2024-01-01 00:00:00+00'
    )
ON CONFLICT (version) DO NOTHING;

-- =============================================================================
-- 4. RESTRICTED REGIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS restricted_regions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code        CHAR(2) NOT NULL,
    state_code          VARCHAR(10),
    restriction_type    VARCHAR(20) NOT NULL,  -- 'full_ban', 'specific_products', 'kyc_required'
    reason              TEXT,
    product_ids         UUID[],  -- NULL = all products
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT restricted_regions_unique UNIQUE (country_code, state_code, restriction_type)
);

-- Countries where peptides are restricted
INSERT INTO restricted_regions (id, country_code, state_code, restriction_type, reason)
VALUES
    ('rr_au_001', 'AU', NULL, 'full_ban', 'Australia TGA regulations prohibit peptide imports'),
    ('rr_ca_001', 'CA', NULL, 'full_ban', 'Canada Health regulations restrict peptide sales'),
    ('rr_uk_001', 'GB', NULL, 'full_ban', 'UK MHRA regulations prohibit peptide imports'),
    ('rr_nz_001', 'NZ', NULL, 'full_ban', 'New Zealand Medsafe regulations restrict peptides')
ON CONFLICT (country_code, state_code, restriction_type) DO NOTHING;

-- US states with additional requirements (example)
INSERT INTO restricted_regions (id, country_code, state_code, restriction_type, reason)
VALUES
    ('rr_us_ny_001', 'US', 'NY', 'kyc_required', 'New York requires enhanced verification')
ON CONFLICT (country_code, state_code, restriction_type) DO NOTHING;

-- =============================================================================
-- 5. EMAIL TEMPLATES (Reference)
-- =============================================================================

CREATE TABLE IF NOT EXISTS email_templates (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key        VARCHAR(100) NOT NULL UNIQUE,
    subject             VARCHAR(255) NOT NULL,
    description         TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO email_templates (id, template_key, subject, description)
VALUES
    ('et_001', 'order_confirmation', 'Order Confirmed - #{{order_number}}', 'Sent when order is created'),
    ('et_002', 'payment_instructions', 'Payment Instructions - Order #{{order_number}}', 'Sent with manual payment details'),
    ('et_003', 'payment_received', 'Payment Received - Order #{{order_number}}', 'Sent when payment is confirmed'),
    ('et_004', 'order_shipped', 'Your Order Has Shipped - #{{order_number}}', 'Sent when order ships'),
    ('et_005', 'order_delivered', 'Order Delivered - #{{order_number}}', 'Sent when delivery is confirmed'),
    ('et_006', 'payment_reminder', 'Payment Reminder - Order #{{order_number}}', 'Sent 24h before payment expires'),
    ('et_007', 'payment_expired', 'Payment Expired - Order #{{order_number}}', 'Sent when payment window closes'),
    ('et_008', 'welcome', 'Welcome to Science Based Body', 'Sent on account creation'),
    ('et_009', 'password_reset', 'Reset Your Password', 'Password reset request'),
    ('et_010', 'kyc_required', 'Verification Required for Your Order', 'KYC threshold reached')
ON CONFLICT (template_key) DO UPDATE SET
    subject = EXCLUDED.subject,
    description = EXCLUDED.description,
    updated_at = NOW();

RAISE NOTICE 'Base seed completed successfully';
