# Multi-stage Dockerfile for the entire application
FROM node:22-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy all package files
COPY package*.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
COPY tsconfig.base.json ./

# Install dependencies
RUN npm ci

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build both applications
RUN npm run build --workspace frontend

# Production frontend image
FROM base AS frontend
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built frontend
COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/public ./apps/frontend/public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "apps/frontend/server.js"]

# Production backend image  
FROM base AS backend
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 backend

# Copy source files for backend (since it doesn't have a proper build yet)
COPY --from=deps /app/node_modules ./node_modules
COPY apps/backend ./apps/backend
COPY tsconfig.base.json ./

USER backend
EXPOSE 8080
ENV PORT=8080
WORKDIR /app/apps/backend
CMD ["npm", "run", "dev"]