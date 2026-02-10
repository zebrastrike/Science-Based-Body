# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install OpenSSL for Prisma engine compatibility on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files and install all deps (need prisma CLI for generate)
COPY package*.json ./
RUN npm ci

# Copy Prisma schema and generate client with correct binary target
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate

# Prune dev dependencies for smaller image
RUN npm prune --production

# Copy built application
COPY --from=builder /app/dist ./dist

# Create uploads directory and non-root user
RUN mkdir -p /app/uploads/affiliates /app/uploads/partners
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001
RUN chown -R nestjs:nodejs /app/uploads
USER nestjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/v1/health || exit 1

# Start application
CMD ["node", "dist/src/main"]
