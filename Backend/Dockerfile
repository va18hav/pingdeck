# Stage 1: Base image
FROM node:22-alpine AS base
RUN apk add --no-cache openssl libc6-compat

# Stage 2: Install all dependencies for compiling
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY apps/scheduler/package.json ./apps/scheduler/
COPY apps/worker/package.json ./apps/worker/

RUN npm ci

# Stage 3: Build/compile source files
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY apps/scheduler/package.json ./apps/scheduler/
COPY apps/worker/package.json ./apps/worker/

COPY packages/shared ./packages/shared
COPY packages/db ./packages/db
COPY apps/scheduler ./apps/scheduler
COPY apps/worker ./apps/worker

# Generates Prisma client and compiles typescript code to javascript dist files
RUN npm run build

# Stage 4: Install production-only dependencies
FROM base AS production-deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY apps/scheduler/package.json ./apps/scheduler/
COPY apps/worker/package.json ./apps/worker/

RUN npm ci --omit=dev

# Stage 5: Final runner image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy production dependencies and symlinks
COPY --from=production-deps /app/node_modules ./node_modules
COPY package.json ./

# Copy built code and configuration files preserving relative paths for workspace resolution
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

COPY --from=builder /app/packages/db/package.json ./packages/db/
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/db/prisma.config.ts ./packages/db/

COPY --from=builder /app/apps/scheduler/package.json ./apps/scheduler/
COPY --from=builder /app/apps/scheduler/dist ./apps/scheduler/dist

COPY --from=builder /app/apps/worker/package.json ./apps/worker/
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist

# Expose ports: 3000 for scheduler, 3001 for worker metrics
EXPOSE 3000 3001

CMD ["npm", "run", "start", "-w", "apps/scheduler"]
