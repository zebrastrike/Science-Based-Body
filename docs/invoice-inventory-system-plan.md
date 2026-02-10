# Automated Invoice-to-Inventory Management System

## Overview
Upload supplier invoices → auto-parse line items → update inventory, COGS, and batch tracking with minimal manual input. Eliminates manual stock counts and reduces human error in inventory management.

---

## Phase 1: Invoice Upload & Storage

### What
- Admin uploads supplier invoice (PDF, image, or CSV) via admin dashboard
- Files stored in Cloudflare R2 with metadata
- Invoice record created in DB with status tracking

### Schema
```prisma
model SupplierInvoice {
  id              String   @id @default(cuid())
  supplierId      String?
  supplier        Supplier? @relation(fields: [supplierId], references: [id])
  invoiceNumber   String   @unique
  invoiceDate     DateTime
  dueDate         DateTime?
  totalAmount     Decimal
  currency        String   @default("USD")
  status          InvoiceStatus @default(UPLOADED) // UPLOADED, PARSING, PARSED, REVIEW, APPROVED, REJECTED
  fileUrl         String   // R2 storage URL
  fileType        String   // pdf, png, csv
  rawOcrText      String?  // raw OCR output for audit
  parsedData      Json?    // structured extraction result
  approvedById    String?
  approvedAt      DateTime?
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  lineItems       InvoiceLineItem[]
}

model InvoiceLineItem {
  id              String   @id @default(cuid())
  invoiceId       String
  invoice         SupplierInvoice @relation(fields: [invoiceId], references: [id])
  productId       String?  // matched product (null if unmatched)
  product         Product? @relation(fields: [productId], references: [id])
  variantId       String?  // matched variant
  description     String   // raw line item text from invoice
  sku             String?  // supplier SKU
  quantity        Int
  unitCost        Decimal
  lineTotal       Decimal
  batchNumber     String?
  expirationDate  DateTime?
  matched         Boolean  @default(false) // auto-matched to a product?
  matchConfidence Float?   // 0-1 confidence score
  createdAt       DateTime @default(now())
}

model Supplier {
  id              String   @id @default(cuid())
  name            String
  contactEmail    String?
  website         String?
  skuMapping      Json?    // { "SUPPLIER-SKU-123": "SBB-PEP-001" } persistent mapping
  invoices        SupplierInvoice[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model InventoryBatch {
  id              String   @id @default(cuid())
  productId       String
  product         Product  @relation(fields: [productId], references: [id])
  variantId       String?
  batchNumber     String
  quantity        Int      // units received
  remaining       Int      // units still in stock
  unitCost        Decimal  // COGS per unit
  invoiceLineId   String?  // trace back to invoice
  coaUrl          String?  // Certificate of Analysis file
  expirationDate  DateTime?
  receivedAt      DateTime @default(now())
  createdAt       DateTime @default(now())
}
```

### Endpoints
```
POST   /api/v1/admin/invoices/upload     - Upload invoice file
GET    /api/v1/admin/invoices            - List invoices (paginated, filterable)
GET    /api/v1/admin/invoices/:id        - Invoice detail + line items
DELETE /api/v1/admin/invoices/:id        - Delete draft/rejected invoice
```

---

## Phase 2: Invoice Parsing (OCR + AI Extraction)

### What
- PDF/image invoices → OCR text extraction
- AI (Claude API) parses OCR text into structured line items
- CSV invoices → direct column mapping
- Each line item: product description, SKU, quantity, unit cost, batch #

### Tech Stack Options
| Approach | Pros | Cons |
|----------|------|------|
| **Anthropic Claude API** | Best accuracy, handles messy invoices, already have relationship | API cost per parse |
| **Tesseract.js (self-hosted OCR)** + regex | Free, no external deps | Fragile, bad with varied formats |
| **AWS Textract** | Great table extraction | Additional vendor, cost |

### Recommended: Claude API
1. Upload PDF → extract text with `pdf-parse` (or image → base64)
2. Send to Claude with structured prompt:
   ```
   Extract line items from this supplier invoice. Return JSON:
   {
     "invoiceNumber": "",
     "invoiceDate": "",
     "supplier": "",
     "lineItems": [
       { "description": "", "sku": "", "quantity": 0, "unitCost": 0.00, "batchNumber": "" }
     ],
     "subtotal": 0.00,
     "tax": 0.00,
     "shipping": 0.00,
     "total": 0.00
   }
   ```
3. Store raw OCR + parsed JSON for audit trail
4. Status → PARSED

### Endpoints
```
POST /api/v1/admin/invoices/:id/parse   - Trigger parsing (async job)
GET  /api/v1/admin/invoices/:id/parsed  - Get parsed results
```

---

## Phase 3: Product Matching & Review

### What
- Each parsed line item → attempt auto-match to existing products
- Match by: supplier SKU mapping → SBB SKU → fuzzy name match
- Admin reviews matches, corrects mismatches, confirms quantities
- Unmatched items flagged for manual mapping (creates persistent SKU mapping)

### Matching Logic (priority order)
1. **Exact SKU mapping** — check `Supplier.skuMapping` JSON for known translations
2. **SBB SKU match** — if invoice SKU matches our internal SKU
3. **Name similarity** — fuzzy match invoice description against product names (Levenshtein distance or similar)
4. **Manual** — admin picks from product dropdown, option to save mapping for future

### Admin Review UI Flow
```
┌─────────────────────────────────────────────────┐
│ Invoice #INV-2026-0042 from PeptideSupplyCo     │
│ Date: 2026-03-15  |  Total: $4,280.00           │
├─────────────────────────────────────────────────┤
│ Line Items:                                      │
│                                                  │
│ ✅ BPC-157 5mg x20     → BPC-157 5mg (98% conf) │
│ ✅ TB-500 5mg x15      → TB-500 5mg (95% conf)  │
│ ⚠️ Reta 10mg x10      → Retatrutide 10mg (72%) │
│ ❌ CJC-DAC Combo x5   → No match found          │
│                                                  │
│ [Approve All Matched] [Review Flagged Items]     │
└─────────────────────────────────────────────────┘
```

### Endpoints
```
POST /api/v1/admin/invoices/:id/match              - Run auto-matching
PUT  /api/v1/admin/invoices/:id/items/:itemId/match - Manual match correction
POST /api/v1/admin/invoices/:id/approve             - Approve and apply to inventory
```

---

## Phase 4: Inventory Update & Batch Tracking

### What
- On approval → create InventoryBatch records per line item
- Update product stock quantities (additive)
- Calculate weighted average COGS
- Associate COA uploads with batch records
- Full audit trail: who approved, when, what changed

### Inventory Update Flow
```
Invoice Approved
    │
    ├─→ For each matched line item:
    │     ├─→ Create InventoryBatch record (quantity, unitCost, batchNumber)
    │     ├─→ product.stockQuantity += lineItem.quantity
    │     ├─→ Recalculate product.avgCost (weighted average)
    │     └─→ AuditLog entry
    │
    ├─→ Invoice status → APPROVED
    │
    └─→ Notification: "Invoice #X processed: +20 BPC-157, +15 TB-500..."
```

### COGS Calculation
```
newAvgCost = (existingStock × oldAvgCost + newQuantity × newUnitCost) / (existingStock + newQuantity)
```

### Endpoints
```
GET    /api/v1/admin/inventory/batches           - List all batches
GET    /api/v1/admin/inventory/batches/:productId - Batches for a product
POST   /api/v1/admin/inventory/batches/:id/coa   - Upload COA for batch
GET    /api/v1/admin/inventory/cogs               - COGS report
```

---

## Phase 5: Auto-Deduction on Orders (FIFO)

### What
- When order ships → auto-deduct from oldest batch first (FIFO)
- Track which batch each sold unit came from (compliance traceability)
- Low stock alerts based on batch remaining quantities
- Expiration warnings for batches nearing expiry

### Deduction Logic
```
Order ships (3 units of BPC-157):
    │
    ├─→ Batch #B001 (remaining: 2) → deduct 2, remaining: 0
    ├─→ Batch #B002 (remaining: 8) → deduct 1, remaining: 7
    │
    └─→ OrderItem linked to both batches for traceability
```

### Alerts
- **Low stock**: batch remaining < threshold → email admin
- **Expiring soon**: batch expiration < 30 days → email admin
- **Out of stock**: remaining = 0 → auto-set product inactive (or flag)

---

## Phase 6: Dashboard & Reports

### Inventory Dashboard Widgets
- Total inventory value (quantity × avgCost)
- Low stock products list
- Expiring batches (next 60 days)
- Recent invoice history
- COGS margin analysis per product

### Reports
- **Inventory Valuation** — current stock × weighted avg cost
- **COGS Report** — cost of goods sold per period
- **Supplier Spend** — total spend per supplier over time
- **Batch Traceability** — for any order, trace back to supplier invoice + batch
- **Shrinkage/Adjustment Log** — manual adjustments with reasons

---

## Implementation Priority

| Phase | Effort | Value | Priority |
|-------|--------|-------|----------|
| 1. Upload & Storage | 1-2 days | Foundation | 🔴 Do first |
| 2. AI Parsing | 2-3 days | Core automation | 🔴 Do first |
| 3. Product Matching | 2-3 days | Accuracy | 🟡 Do second |
| 4. Inventory Update | 1-2 days | The whole point | 🟡 Do second |
| 5. FIFO Deduction | 2-3 days | Compliance | 🟢 Do third |
| 6. Dashboard | 2-3 days | Visibility | 🟢 Do third |

**Total estimated effort: ~2 weeks of backend work**

---

## Dependencies & Prerequisites
- [ ] Cloudflare R2 configured (file storage for invoices + COAs)
- [ ] Anthropic API key (for Claude invoice parsing)
- [ ] Supplier info collected (names, typical invoice formats)
- [ ] Product catalog fully populated with SKUs
- [ ] Frontend admin pages built by Codex (upload form, review UI, dashboard widgets)

## Security & Compliance Notes
- Invoice files stored encrypted in R2
- All inventory changes logged to AuditLog
- Batch → COA linking required for compliance
- FIFO deduction creates full traceability chain: customer order → batch → supplier invoice
- Admin-only access, all actions require ADMIN or SUPER_ADMIN role
