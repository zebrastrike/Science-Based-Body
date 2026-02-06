# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files from apps/web
COPY apps/web/package*.json ./

# Install dependencies
RUN npm ci

# Copy web app source
COPY apps/web/ ./

# Copy legacy HTML files and assets from repo root
COPY index.html shop.html product.html branded-for-science.html brand-partnerships.html affiliate-program.html ./
COPY checkout.html about.html support.html faq.html tracking.html ./
COPY testing-standards.html storage-guidelines.html coa-verification.html ./
COPY terms.html privacy.html shipping.html returns.html ./
COPY research-use.html compliance.html cookies.html accessibility.html ./
COPY styles.css scripts.js ./

# Set build-time environment variables
ENV NEXT_PUBLIC_API_URL=https://api.sbbpeptides.com/api/v1
ENV NEXT_PUBLIC_SITE_URL=https://sbbpeptides.com

# Build the app
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=https://api.sbbpeptides.com/api/v1
ENV NEXT_PUBLIC_SITE_URL=https://sbbpeptides.com

# Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy legacy HTML files to production (for runtime SSR if needed)
COPY --from=builder /app/*.html ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
