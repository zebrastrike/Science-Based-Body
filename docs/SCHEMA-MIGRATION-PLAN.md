# Schema Migration Plan

## Current State Assessment

The existing Prisma schema at `apps/api/prisma/schema.prisma` has good coverage for:
- Users, Addresses, Organizations (B2B)
- Products, Variants, Batches, Inventory
- Orders, OrderItems
- Payments (basic)
- Shipments
- Compliance
- Audit Logs

## Gap Analysis

### Critical Missing Tables

| Table | Purpose | Priority |
|-------|---------|----------|
| `carts` / `cart_items` | Pre-order shopping cart | HIGH |
| `payment_attempts` | Audit trail for payment flows | HIGH |
| `order_status_history` | Order state change audit | HIGH |
| `events` | First-party behavioral tracking | HIGH |
| `webhooks_inbox` | Inbound webhook storage | MEDIUM |
| `webhooks_outbox` | Outbound event queue | MEDIUM |
| `refunds` | Separate refund tracking | MEDIUM |

### Schema Enhancements Needed

| Current | Enhancement | Reason |
|---------|-------------|--------|
| `Payment.method` is enum | Change to FK to `payment_methods` table | Flexibility for new methods |
| No `amount_paid` on Order | Add computed field | Track partial payments |
| No ERP sync fields | Add `erp_*_id` and `erp_synced_at` | Epicor Propello prep |
| Events tracking | Add `events` table | Attribution & analytics |
| Anonymous carts | Add `anonymous_id` to carts | Pre-login cart capture |

---

## Migration Steps

### Phase 1: Add Cart System (Do First)

```prisma
// Add to schema.prisma

model Cart {
  id              String      @id @default(cuid())

  userId          String?
  user            User?       @relation(fields: [userId], references: [id], onDelete: SetNull)

  anonymousId     String?     // Browser fingerprint for non-logged-in users

  status          CartStatus  @default(ACTIVE)

  subtotalCents   Int         @default(0)
  discountCents   Int         @default(0)
  totalCents      Int         @default(0)

  discountCode    String?

  // Attribution
  utmSource       String?
  utmMedium       String?
  utmCampaign     String?

  convertedToOrderId String?
  convertedAt     DateTime?

  items           CartItem[]

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  expiresAt       DateTime?

  @@unique([userId], name: "cart_user_active")
  @@index([anonymousId])
  @@index([status])
}

model CartItem {
  id              String    @id @default(cuid())
  cartId          String
  cart            Cart      @relation(fields: [cartId], references: [id], onDelete: Cascade)

  productId       String
  product         Product   @relation(fields: [productId], references: [id])

  variantId       String?
  variant         ProductVariant? @relation(fields: [variantId], references: [id])

  quantity        Int       @default(1)
  unitPriceCents  Int

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@unique([cartId, productId, variantId])
  @@index([cartId])
}

enum CartStatus {
  ACTIVE
  MERGED
  CONVERTED
  ABANDONED
  EXPIRED
}
```

**Migration Command:**
```bash
npx prisma migrate dev --name add_cart_system
```

---

### Phase 2: Add Payment Methods Table

```prisma
// Replace PaymentMethod enum with table

model PaymentMethod {
  id              String    @id @default(cuid())

  methodType      String    // 'zelle', 'cashapp', 'wire_transfer', 'erp_propello'
  name            String

  isActive        Boolean   @default(true)
  isManual        Boolean   @default(true)  // Requires admin confirmation

  instructions    String    @db.Text
  paymentDetails  Json      // Email, cashtag, bank details, etc.

  minAmountCents  Int       @default(0)
  maxAmountCents  Int?

  confirmationWindowHours Int @default(48)

  sortOrder       Int       @default(0)
  iconUrl         String?

  payments        Payment[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([isActive])
}

// Update Payment model
model Payment {
  // ... existing fields ...

  // Replace: method PaymentMethod
  // With:
  paymentMethodId String
  paymentMethod   PaymentMethod @relation(fields: [paymentMethodId], references: [id])

  // Add new fields
  paymentReference String    @unique  // Human-readable reference
  customerReference String?  // Customer's transaction ID
  expiresAt       DateTime?
  completedAt     DateTime?

  attempts        PaymentAttempt[]
}

model PaymentAttempt {
  id              String    @id @default(cuid())
  paymentId       String
  payment         Payment   @relation(fields: [paymentId], references: [id], onDelete: Cascade)

  attemptNumber   Int       @default(1)
  action          String    // 'customer_submit', 'admin_verify', 'admin_reject', 'auto_expire'
  performedBy     String?   // User ID
  performedByType String    // 'customer', 'admin', 'system'

  success         Boolean
  failureReason   String?

  requestData     Json?
  responseData    Json?

  ipAddress       String?
  userAgent       String?

  createdAt       DateTime  @default(now())

  @@index([paymentId])
}
```

**Data Migration:**
```sql
-- Create payment_methods from existing payments
INSERT INTO "PaymentMethod" (id, "methodType", name, "isActive", "isManual", instructions, "paymentDetails")
SELECT DISTINCT
  gen_random_uuid(),
  method::text,
  method::text,
  true,
  CASE WHEN method IN ('ZELLE', 'CASHAPP', 'WIRE_TRANSFER') THEN true ELSE false END,
  '',
  '{}'::jsonb
FROM "Payment";

-- Update payments to reference payment_methods
UPDATE "Payment" p
SET "paymentMethodId" = pm.id
FROM "PaymentMethod" pm
WHERE pm."methodType" = p.method::text;
```

---

### Phase 3: Add Order Status History

```prisma
model OrderStatusHistory {
  id              String      @id @default(cuid())
  orderId         String
  order           Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)

  fromStatus      OrderStatus?
  toStatus        OrderStatus

  reason          String?
  changedBy       String?     // User ID
  changedByType   String      @default("system")  // system, admin, customer, webhook

  metadata        Json?

  createdAt       DateTime    @default(now())

  @@index([orderId])
  @@index([createdAt])
}

// Add to Order model:
model Order {
  // ... existing ...

  amountPaidCents Int         @default(0)

  statusHistory   OrderStatusHistory[]

  // ERP Integration
  erpOrderId      String?
  erpSyncedAt     DateTime?

  @@index([erpOrderId])
}
```

---

### Phase 4: Add Events Table (First-Party Analytics)

```prisma
model Event {
  id              String    @id @default(cuid())

  eventName       String
  eventCategory   String    // page, user, cart, checkout, order, system

  // Actor (one of these set)
  userId          String?
  user            User?     @relation(fields: [userId], references: [id])
  anonymousId     String?
  sessionId       String?

  // Context
  pageUrl         String?
  pageTitle       String?
  referrerUrl     String?

  // Attribution
  utmSource       String?
  utmMedium       String?
  utmCampaign     String?
  utmTerm         String?
  utmContent      String?

  // Associated entities
  productId       String?
  cartId          String?
  orderId         String?
  paymentId       String?

  // Flexible payload
  properties      Json      @default("{}")

  // Client info
  ipAddress       String?
  userAgent       String?
  deviceType      String?
  browser         String?
  os              String?

  // Geo
  countryCode     String?
  region          String?
  city            String?

  clientTimestamp DateTime?
  createdAt       DateTime  @default(now())

  @@index([eventName])
  @@index([eventCategory])
  @@index([userId])
  @@index([anonymousId])
  @@index([sessionId])
  @@index([createdAt])
  @@index([orderId])
}
```

---

### Phase 5: Add Webhook Tables

```prisma
model WebhookInbox {
  id              String    @id @default(cuid())

  source          String    // 'epicor_propello', 'shippo', 'mailgun'
  webhookType     String    // Event type from provider

  status          String    @default("pending")  // pending, processing, completed, failed, skipped
  attempts        Int       @default(0)
  maxAttempts     Int       @default(3)

  headers         Json
  payload         Json

  signature       String?
  signatureValid  Boolean?

  processedAt     DateTime?
  errorMessage    String?
  result          Json?

  relatedOrderId  String?
  relatedPaymentId String?

  receivedAt      DateTime  @default(now())
  createdAt       DateTime  @default(now())

  @@index([status, source])
  @@index([createdAt])
}

model WebhookOutbox {
  id              String    @id @default(cuid())

  destination     String    // 'epicor_propello', 'internal_email'
  endpointUrl     String?

  eventType       String
  payload         Json

  status          String    @default("pending")
  attempts        Int       @default(0)
  maxAttempts     Int       @default(3)

  lastAttemptAt   DateTime?
  responseStatus  Int?
  responseBody    String?
  errorMessage    String?

  entityType      String?   // 'order', 'payment', 'user'
  entityId        String?

  scheduledFor    DateTime  @default(now())

  createdAt       DateTime  @default(now())

  @@index([status, scheduledFor])
  @@index([entityType, entityId])
}
```

---

### Phase 6: Add ERP Sync Fields to All Relevant Tables

```prisma
// Add to User model:
erpCustomerId   String?
erpSyncedAt     DateTime?

// Add to Product model:
erpItemId       String?
erpSyncedAt     DateTime?

// Add to Payment model:
erpPaymentId    String?
erpSyncedAt     DateTime?

// Add to Shipment model:
erpShipmentId   String?
erpSyncedAt     DateTime?
```

---

## Migration Sequence

Run migrations in this order:

```bash
# 1. Cart system
npx prisma migrate dev --name add_cart_system

# 2. Payment methods table
npx prisma migrate dev --name add_payment_methods_table

# 3. Order enhancements
npx prisma migrate dev --name add_order_status_history

# 4. Events table
npx prisma migrate dev --name add_events_table

# 5. Webhook tables
npx prisma migrate dev --name add_webhook_tables

# 6. ERP sync fields
npx prisma migrate dev --name add_erp_sync_fields
```

---

## Backwards Compatibility

The existing schema will continue to work. New tables are additive. The only breaking change is:
- `Payment.method` enum → `Payment.paymentMethodId` FK

This requires a data migration (provided above) during deployment.

---

## Rollback Plan

Each migration can be rolled back individually:
```bash
npx prisma migrate resolve --rolled-back <migration_name>
```

For the payment method change, keep the old enum field until fully migrated:
```prisma
model Payment {
  method          PaymentMethod?  // OLD - deprecated
  paymentMethodId String?         // NEW
}
```

Remove `method` field only after confirming all data migrated.
