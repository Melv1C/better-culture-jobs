FROM node:22-alpine AS base
RUN apk update && apk add --no-cache libc6-compat
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# ---
FROM base AS prepare
RUN pnpm install -g turbo@^2
COPY . .
# Prune the monorepo for the backend app
RUN turbo prune backend --docker

# ---
FROM base AS installer
# First install the dependencies (as they change less often)
COPY --from=prepare /app/out/json/ .
# Remove package-lock.json to avoid conflicts
RUN rm -f package-lock.json
# Install dependencies
RUN pnpm i

# ---
FROM base AS builder
# Copy dependencies
COPY --from=installer /app/ .
# Copy source files
COPY --from=prepare /app/out/full/ .

# Build backend
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
RUN pnpm run prisma:generate
RUN pnpm build --filter=backend

# ---
FROM base AS runner
# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
USER nodejs

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder --chown=nodejs:nodejs /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder --chown=nodejs:nodejs /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder --chown=nodejs:nodejs /app/apps/backend/prisma.config.ts ./apps/backend/prisma.config.ts
COPY --from=builder --chown=nodejs:nodejs /app/apps/backend/generated ./apps/backend/generated
COPY --from=builder --chown=nodejs:nodejs /app/apps/backend/scripts ./apps/backend/scripts
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

CMD ["pnpm", "--filter", "backend", "start"]
