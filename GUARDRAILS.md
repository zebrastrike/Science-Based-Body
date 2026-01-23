# GUARDRAILS.md - Compliance & Legal Requirements

## Science Based Body - Peptide E-Commerce Compliance Framework

This document defines the non-negotiable compliance requirements for the Science Based Body platform. All agents, developers, and systems MUST adhere to these guardrails.

---

## 1. PRODUCT CLASSIFICATION

### Allowed Product Categories
```
RESEARCH_PEPTIDES              - Peptides for laboratory research
ANALYTICAL_REFERENCE_MATERIALS - Chemical standards and references
LABORATORY_ADJUNCTS            - Supporting research materials
RESEARCH_COMBINATIONS          - Bundled research materials
MATERIALS_SUPPLIES             - Lab equipment and supplies
MERCHANDISE                    - Branded non-consumable items
```

### Forbidden Product Classifications
- Dietary supplements
- Medications/pharmaceuticals
- Food products
- Cosmetics for consumer use
- Any product marketed for human consumption

---

## 2. LANGUAGE RESTRICTIONS

### FORBIDDEN TERMS (Auto-reject in content/marketing)
```
supplement          treatment           cure
therapy             dosage              dose
patient             prescription        medication
healing             medicine            drug
health benefit      wellness benefit    therapeutic
anti-aging          weight loss         muscle building
performance         enhancement         side effects
clinical            FDA approved        doctor recommended
```

### REQUIRED TERMS (Must appear in all product descriptions)
```
research use only           laboratory purposes
analytical standard         reference material
not for human consumption   research chemical
```

### REQUIRED DISCLAIMERS

#### Primary Disclaimer (Every page footer)
```
All statements on this website have not been evaluated by the FDA.
All products are sold strictly for research, laboratory, or analytical
purposes only. Products are not intended to diagnose, treat, cure, or
prevent any disease. Not for human or veterinary consumption.
```

#### Pharmacy Disclaimer (Checkout & About pages)
```
Science Based Body operates solely as a chemical and research materials
supplier. We are not a compounding pharmacy or chemical compounding
facility as defined under Section 503A or 503B of the Federal Food,
Drug, and Cosmetic Act.
```

#### Liability Disclaimer (Terms of Service)
```
By purchasing from Science Based Body, you acknowledge that all products
are intended solely for lawful laboratory research and analytical use.
You accept full responsibility for ensuring compliance with all applicable
federal, state, and local regulations regarding the purchase, handling,
storage, and use of research materials. Science Based Body assumes no
liability for any misuse of products purchased through this platform.
```

---

## 3. AGE VERIFICATION REQUIREMENTS

### Checkout Age Gate
- **Minimum Age**: 21 years old
- **Verification Method**: Checkbox acknowledgment + stored consent
- **Failure Action**: Block checkout, display age restriction message

### Implementation Requirements
```typescript
interface AgeVerification {
  confirmed: boolean;        // User clicked checkbox
  dateConfirmed: DateTime;   // Timestamp of confirmation
  ipAddress: string;         // IP at time of confirmation
  userAgent: string;         // Browser info
}
```

### Age Gate Copy
```
AGE VERIFICATION REQUIRED

You must be 21 years of age or older to purchase research materials
from Science Based Body. By checking this box, you confirm that you
are at least 21 years old and legally permitted to purchase research
chemicals in your jurisdiction.

[ ] I confirm I am 21 years of age or older
```

---

## 4. CHECKOUT COMPLIANCE ACKNOWLEDGMENTS

### Required Checkboxes (ALL must be checked)

1. **Research Purpose Only**
   ```
   [ ] I confirm that all products I am purchasing are intended solely
       for legitimate research, laboratory, or analytical purposes.
   ```

2. **Age Confirmation**
   ```
   [ ] I confirm that I am 21 years of age or older.
   ```

3. **No Human Consumption**
   ```
   [ ] I understand and acknowledge that these products are NOT intended
       for human or veterinary consumption and will not be used as such.
   ```

4. **Responsibility Acceptance**
   ```
   [ ] I accept full responsibility for the proper handling, storage,
       and lawful use of all research materials purchased.
   ```

5. **Terms & Conditions**
   ```
   [ ] I have read and agree to the Terms of Service, Privacy Policy,
       and Shipping & Returns Policy.
   ```

### Storage Requirements
```typescript
interface ComplianceAcknowledgment {
  orderId: string;
  userId: string;
  researchPurposeOnly: boolean;
  ageConfirmation: boolean;
  noHumanConsumption: boolean;
  responsibilityAccepted: boolean;
  termsAccepted: boolean;
  ipAddress: string;
  userAgent: string;
  timestamp: DateTime;
  checkboxVersion: string;  // Track version of compliance text
}
```

---

## 5. CERTIFICATE OF ANALYSIS (COA) REQUIREMENTS

### Every Product Batch MUST Have:
- Unique batch number
- Manufacturing date
- Expiration date
- Purity percentage (HPLC verified)
- Identity confirmation
- Appearance/physical properties
- PDF COA document uploaded to secure storage

### COA Display Rules
- COA accessible from product page via modal
- Never expose raw PDF URL publicly
- Use signed URLs with 1-hour expiry
- Log all COA downloads for audit

### Batch Data Structure
```typescript
interface ProductBatch {
  batchNumber: string;          // e.g., "SBB-BPC157-2024-001"
  productId: string;
  manufacturingDate: DateTime;
  expirationDate: DateTime;
  purityPercent: number;        // e.g., 99.5
  coaFileId: string;            // Reference to secure file
  msdsFileId?: string;          // Material Safety Data Sheet
  isActive: boolean;
  inventoryCount: number;
  createdAt: DateTime;
}
```

---

## 6. SHIPPING RESTRICTIONS

### Prohibited Shipping Destinations

#### US States with Restrictions
```
Research peptide shipping may be restricted to:
- Verify state-specific regulations before shipping
- Maintain updated list of restricted states
- Block checkout for restricted addresses
```

#### International Restrictions
```
- No international shipping without additional compliance
- Require import documentation for international orders
- Block shipments to countries with peptide bans
```

### Shipping Labels
- No product names on external packaging
- Generic "Research Materials" description only
- Return address: "SBB Research Materials"
- Include batch tracking number internally

---

## 7. PAYMENT COMPLIANCE

### Accepted Payment Methods
- Epicor Propello (Primary processor)
- Wire Transfer (High-value orders)
- Cryptocurrency (If legally permitted)

### Payment Processing Rules
- No refunds for compliance violations
- Hold shipment until payment verified
- Document all payment verification steps
- Manual review for orders > $500

### Fraud Prevention
- Require billing/shipping address match for new customers
- Flag orders with multiple failed payment attempts
- Block known fraud indicators
- Maintain chargeback documentation

---

## 8. DATA PROTECTION & PRIVACY

### PII Encryption Requirements
Fields requiring encryption at rest:
```
- Full legal name
- Date of birth
- Government ID numbers
- Full address
- Phone number
- Payment card details (if stored)
- KYC documents
```

### Data Retention Policy
```
Customer data:     7 years (legal requirement)
Order records:     7 years (tax requirement)
Payment records:   7 years (financial compliance)
Compliance logs:   10 years (audit trail)
KYC documents:     5 years after last order
```

### Right to Deletion
- Anonymize data where legally permitted
- Never delete compliance acknowledgments
- Never delete completed order records
- Provide data export on request

---

## 9. KYC (Know Your Customer) REQUIREMENTS

### When KYC is Required
- Orders exceeding $1,000 total
- First-time orders exceeding $500
- Orders to new shipping addresses for existing customers
- Any flagged suspicious activity

### KYC Documentation
```typescript
interface KycVerification {
  userId: string;
  verificationType: 'STANDARD' | 'ENHANCED';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  documents: KycDocument[];
  submittedAt: DateTime;
  reviewedAt?: DateTime;
  reviewedBy?: string;
  rejectionReason?: string;
  expiresAt: DateTime;  // Annual re-verification
}

interface KycDocument {
  type: 'GOVERNMENT_ID' | 'PROOF_OF_ADDRESS' | 'BUSINESS_LICENSE';
  fileId: string;       // Secure storage reference
  uploadedAt: DateTime;
  verifiedAt?: DateTime;
}
```

---

## 10. AUDIT LOGGING REQUIREMENTS

### Events That MUST Be Logged
```
- User registration
- User login/logout
- Password changes
- Order creation
- Payment submission
- Payment verification
- Order status changes
- Shipment creation
- Admin actions
- Compliance acknowledgments
- KYC submissions/reviews
- Product/batch modifications
- Price changes
- Refund processing
```

### Audit Log Structure
```typescript
interface AuditLog {
  id: string;
  timestamp: DateTime;
  userId?: string;
  adminId?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  previousState?: JSON;
  newState?: JSON;
  ipAddress: string;
  userAgent: string;
  metadata?: JSON;
}
```

---

## 11. ADMIN ACCESS CONTROLS

### Role Hierarchy
```
SUPER_ADMIN  - Full system access, can create admins
ADMIN        - Order management, product management
SUPPORT      - View orders, customer communication
WAREHOUSE    - Shipping and inventory only
```

### Admin Action Restrictions
- All admin actions logged to audit trail
- Two-factor authentication required
- Session timeout: 30 minutes
- IP whitelist for admin access
- Cannot modify own permissions

---

## 12. INCIDENT RESPONSE

### Compliance Violation Detection
- Automated scanning for forbidden terms
- Payment fraud detection
- Unusual order patterns
- Failed compliance checkbox attempts

### Response Protocol
1. Immediately block affected functionality
2. Log incident with full context
3. Notify compliance officer
4. Document remediation steps
5. Update guardrails if needed

---

## 13. TESTING REQUIREMENTS

### Compliance Tests (Must Pass Before Deploy)
```
[ ] Age gate blocks underage users
[ ] All 5 checkout checkboxes required
[ ] Forbidden terms rejected in product descriptions
[ ] Required disclaimers present on all pages
[ ] COA accessible for all active batches
[ ] Audit logging captures all required events
[ ] KYC triggered at correct thresholds
[ ] Encrypted fields cannot be read without key
[ ] Rate limiting blocks excessive requests
[ ] Payment verification required before shipping
```

---

## VERSION CONTROL

| Version | Date       | Changes                              |
|---------|------------|--------------------------------------|
| 1.0.0   | 2025-01-22 | Initial compliance framework         |

---

**This document is legally binding for all development work on Science Based Body.**
**Violations may result in immediate project termination.**
