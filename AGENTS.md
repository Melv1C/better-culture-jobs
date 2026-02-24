# AGENTS.md

## Project Overview

A Turborepo monorepo with a Hono backend API, two React+Vite frontends (user and admin) clients plus shared packages for UI, utils, and API client.

## Stack

- **Packager**: pnpm
- **Monorepo**: Turborepo
- **Backend**: Hono + Node, Prisma (PostgreSQL), better-auth
- **Frontend/Admin**: React 19, Vite, TanStack Router, TanStack Query
- **UI**: Tailwind CSS 4, @melv1c/ui-core
- **Linting**: Oxlint, Oxfmt
- **Type system**: TypeScript (strict mode)
- **Database**: PostgreSQL (via Docker)

## Repository Structure

```
apps/
  backend/                  # Hono API server
    generated/prisma/       # Prisma client (custom output path)
    prisma/
      schema.prisma
      migrations/
    scripts/
      add-admin.ts          # Create admin users
      sync-json-data.ts     # Sync JSON data to DB
    src/
      index.ts
      lib/                  # Auth, env, logger, Prisma setup
      middlewares/          # Auth and logger middleware
      routes/               # API routes
  frontend/                 # User-facing Vite + React app (port 5173)
    src/
      features/             # Feature-based organization
      lib/                  # API client, auth client, env
      routes/               # TanStack Router routes
      routeTree.gen.ts      # Auto-generated route tree
  admin/                    # Admin Vite + React app (port 5174)
    src/
      features/             # Feature-based organization
      lib/                  # API client, auth client, env
      routes/               # TanStack Router routes
      routeTree.gen.ts      # Auto-generated route tree
packages/
  api-client/               # Shared API client (@repo/api-client)
  ui/                       # Shared UI components (@repo/ui)
  utils/                    # Shared utilities and schemas (@repo/utils)
  typescript-config/        # TypeScript configurations
```

### Features-Based Organization

React apps use a features-based folder structure, grouping related components, hooks, and utilities by feature.

```
src/
  features/
    feature/
      components/       # React components
      hooks/            # React hooks
      utils/            # Utility functions and helpers
      feature-store.ts  # Zustand store for the feature (if needed)
      index.ts          # Exports components, hooks, utils for outer use
```

## Dev Environment

1. Use Node version specified in `.nvmrc`
2. Install dependencies: `pnpm install`
3. Start PostgreSQL: `docker compose -f docker-compose.db.yml up -d`
4. Set up environment files by copying `.env.example` files in `apps/backend`, `apps/frontend`, and `apps/admin`
5. Generate Prisma client: `pnpm run prisma:generate`
6. Run migrations: `pnpm run prisma:migrate`
7. Start all apps: `pnpm run dev`

Backend runs on port 3000, frontend on 5173, admin on 5174.

## Code Conventions

- Oxlint for linting (`pnpm run lint`)
- Oxfmt for formatting (`pnpm run format`)
- TypeScript strict mode across all packages

## Build & CI

- Build: `pnpm run build` (builds all apps and packages in dependency order)
- CI runs: lint, format check, type check, Prisma validation, build
- CI requires `DATABASE_URL` environment variable
- GitHub Actions on PRs and pushes to `main`

## Monorepo Structure

- Turborepo manages task orchestration
- Workspace packages use `*` for local dependencies
- Backend Prisma output goes to `generated/prisma` (not default location)
- Shared packages: `@repo/api-client`, `@repo/utils`, `@repo/ui`, config packages
- All apps and packages are TypeScript modules (`"type": "module"`)
