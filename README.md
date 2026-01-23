# Science Based Body

Female-focused peptide e-commerce platform built with NestJS, Next.js, and PostgreSQL.

## Tech Stack

- **Backend**: NestJS 10 + TypeScript + Prisma
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS (handled by Codex)
- **Database**: PostgreSQL 15 (Hetzner)
- **Cache**: Redis 7
- **Storage**: Cloudflare R2
- **Payments**: Epicor Propello + Manual (Zelle/CashApp/Wire)
- **Shipping**: Shippo
- **Email**: Mailgun

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Science-Based-Body
   ```

2. **Start database services**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

3. **Install dependencies**
   ```bash
   cd apps/api
   npm install
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

5. **Setup database**
   ```bash
   npx prisma generate
   npx prisma db push
   npm run seed:admin
   npm run seed:products
   ```

6. **Start development server**
   ```bash
   npm run start:dev
   ```

7. **Access the API**
   - API: http://localhost:3001/api/v1
   - Swagger: http://localhost:3001/api/docs

## Project Structure

```
Science-Based-Body/
├── apps/
│   ├── api/                 # NestJS Backend
│   │   ├── src/
│   │   │   ├── modules/     # Feature modules
│   │   │   ├── prisma/      # Prisma service
│   │   │   └── audit/       # Audit logging
│   │   └── prisma/          # Database schema
│   │
│   └── web/                 # Next.js Frontend (Codex)
│
├── config/                  # Configuration files
├── scripts/                 # Deployment scripts
├── ssl/                     # SSL certificate info
├── CLAUDE.md               # Agent rules
├── GUARDRAILS.md           # Compliance requirements
└── docker-compose.yml      # Docker configuration
```

## API Modules

| Module | Description |
|--------|-------------|
| auth | JWT authentication, registration, login |
| users | User profiles, addresses |
| catalog | Products, categories, inventory |
| orders | Order creation, management |
| payments | Epicor Propello, manual payments |
| shipping | Shippo integration |
| compliance | Age gates, disclaimers, checkboxes |
| files | Cloudflare R2 file storage |
| kyc | Know Your Customer verification |
| batches | COA management |
| admin | Admin dashboard endpoints |
| notifications | Email via Mailgun |

## Compliance Requirements

This platform handles research peptides. All products must:

1. Be labeled "Research Use Only"
2. Include required FDA disclaimers
3. Require 5 compliance checkboxes at checkout
4. Verify age (21+) before purchase
5. Have COA (Certificate of Analysis) per batch

See [GUARDRAILS.md](./GUARDRAILS.md) for complete compliance requirements.

## Deployment

### Hetzner Server Setup

1. **Initial server setup**
   ```bash
   ./scripts/setup-hetzner.sh
   ```

2. **Configure SSL**
   ```bash
   ./scripts/setup-ssl.sh sciencebasedbody.com
   ```

3. **Deploy application**
   ```bash
   ./scripts/deploy-to-hetzner.sh
   ```

### Environment Variables

See [.env.example](./.env.example) for all required variables.

Critical variables:
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - Token signing (32+ chars)
- `ENCRYPTION_KEY` - PII encryption (64 hex chars)
- `R2_*` - Cloudflare R2 credentials
- `EPICOR_*` - Payment processor
- `SHIPPO_API_KEY` - Shipping
- `MAILGUN_*` - Email service

## Agent Boundaries

- **Backend (Claude)**: NestJS API, database, integrations
- **Frontend (Codex)**: UI/UX, components, styling

See [CLAUDE.md](./CLAUDE.md) for detailed agent rules.

## Commands Reference

```bash
# Database
npx prisma generate       # Generate Prisma client
npx prisma db push        # Push schema to DB
npx prisma studio         # Visual DB editor

# Development
npm run start:dev         # Start with hot reload
npm run build             # Production build
npm run test              # Run tests

# Seeds
npm run seed:admin        # Create admin user
npm run seed:products     # Load sample products

# Docker
docker-compose up -d              # Start services
docker-compose -f docker-compose.dev.yml up -d  # Dev services
docker-compose down               # Stop services
```

## License

Proprietary - All rights reserved.
