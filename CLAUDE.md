# CLAUDE.md - Agent Rules for Science Based Body

## Project Overview
Science Based Body is a female-focused peptide e-commerce platform built with:
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui (HANDLED BY CODEX - DO NOT TOUCH)
- **Backend**: NestJS 10 + TypeScript + Prisma + PostgreSQL
- **Infrastructure**: Hetzner (DB + API), Cloudflare (CDN + R2 Storage), Epicor Propello (Payments)

## Agent Boundaries

### BACKEND AGENT (Claude) - YOUR DOMAIN
You are responsible for:
- Database schema and migrations (Prisma)
- API endpoints and business logic (NestJS)
- Authentication and authorization (JWT)
- Payment processing integration (Epicor Propello)
- Shipping integration (EasyPost)
- File storage (Cloudflare R2)
- Email notifications (Google Workspace SMTP)
- Compliance backend logic
- Security and rate limiting
- Deployment scripts and infrastructure

### FRONTEND AGENT (Codex) - DO NOT TOUCH
Codex is handling ALL frontend work:
- UI/UX design system
- React components
- Page layouts
- Styling (Tailwind CSS)
- Client-side state
- Visual compliance (disclaimer rendering)

**NEVER modify files in:**
- `apps/web/src/app/`
- `apps/web/src/components/`
- `apps/web/public/` (except product images)
- Any `.tsx`, `.jsx`, `.css` files in the web app

## Compliance Hard Rules (NON-NEGOTIABLE)

### NEVER:
1. Add medical claims, dosage recommendations, or therapeutic promises
2. Use forbidden terms: "supplement", "treatment", "cure", "dosage", "patient", "prescription"
3. Suggest products for human consumption
4. Remove or weaken compliance disclaimers
5. Skip age verification at checkout
6. Bypass KYC requirements for high-value orders
7. Store unencrypted PII
8. Log sensitive payment information
9. Allow checkout without compliance acknowledgment
10. Ship to restricted states/countries without verification

### ALWAYS:
1. Enforce "Research Use Only" language in all product data
2. Require 5 compliance checkboxes at checkout
3. Validate age (21+) before order completion
4. Associate COA (Certificate of Analysis) with every batch
5. Log all admin actions to audit trail
6. Encrypt sensitive customer data
7. Rate limit all API endpoints
8. Validate payment before order confirmation
9. Include required legal disclaimers in all communications

## Code Standards

### TypeScript
- Strict mode enabled
- No `any` types without justification
- Proper error handling with typed exceptions
- Use DTOs for all API inputs/outputs

### Database
- All migrations must be reversible
- Soft deletes for compliance data (never hard delete orders/payments)
- Index all foreign keys
- Use transactions for multi-table operations

### Security
- JWT tokens expire in 24 hours
- Passwords hashed with bcrypt (12 rounds)
- Rate limit: 100 requests/minute per IP
- CORS whitelist frontend domains only
- Helmet.js for security headers
- Input sanitization on all endpoints

### API Design
- RESTful conventions
- Pagination for all list endpoints
- Consistent error response format
- Version prefix: `/api/v1/`

## File Structure Reference

```
apps/
├── api/                    # NestJS Backend (YOUR DOMAIN)
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   ├── common/         # Shared utilities
│   │   ├── audit/          # Audit logging
│   │   └── prisma/         # Prisma service
│   └── prisma/
│       └── schema.prisma   # Database schema
│
└── web/                    # Next.js Frontend (CODEX DOMAIN - DO NOT TOUCH)
    └── src/
        ├── app/            # Pages
        └── components/     # UI Components

config/                     # Environment configs
scripts/                    # Deployment scripts
ssl/                        # TLS certificates
```

## Commands

```bash
# Database
npx prisma generate         # Generate Prisma client
npx prisma db push          # Push schema to DB
npx prisma migrate dev      # Create migration
npm run seed                # Seed database

# API Development
cd apps/api
npm run start:dev           # Development mode
npm run build               # Production build
npm run test                # Run tests

# Docker
docker-compose up -d        # Start services
docker-compose down         # Stop services

# Deployment
./scripts/deploy.sh         # Deploy to Hetzner
```

## Environment Variables Required

See `.env.example` for complete list. Critical variables:
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - Token signing key (32+ chars)
- `ENCRYPTION_KEY` - PII encryption (64 hex chars)
- `R2_*` - Cloudflare R2 credentials
- `EPICOR_*` - Payment processor credentials
- `EASYPOST_API_KEY` - Shipping integration
- `SMTP_*` - Email service (Google Workspace)

## Compliance Checkboxes (Required at Checkout)

1. **Research Purpose**: "I confirm all products are for research purposes only"
2. **Age Verification**: "I confirm I am 21 years of age or older"
3. **No Medical Use**: "I understand these products are not for human consumption"
4. **Responsibility**: "I accept full responsibility for proper handling and storage"
5. **Terms Acceptance**: "I have read and agree to the Terms of Service"

## Integration Priorities

1. **Hetzner** - Database (PostgreSQL) + API hosting
2. **Cloudflare R2** - File storage (COAs, KYC documents)
3. **Epicor Propello** - Payment processing
4. **EasyPost** - Shipping labels and tracking
5. **Google Workspace SMTP** - Transactional emails
