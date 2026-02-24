# Fullstack Turbo Kit

A production-ready [Turborepo](https://turbo.build/repo) monorepo starter with full-stack applications and shared packages.

## What's Inside?

### Apps

- **backend** — [Hono](https://hono.dev/) API server
- **frontend** — [Vite](https://vitejs.dev/) + [React](https://react.dev/) application
- **admin** — Vite + React admin application

### Packages

- **@repo/api-client** — Shared API client for frontend-backend communication
- **@repo/utils** — Shared utility functions and constants
- **@repo/typescript-config** — TypeScript configurations
- **@repo/ui** — Shared UI components and design system

All packages and apps are written in [TypeScript](https://www.typescriptlang.org/).

## Getting Started

Install dependencies:

```bash
pnpm install
```

Copy the example environment variables:

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
cp apps/admin/.env.example apps/admin/.env
```

Start the development database (PostgreSQL):

```bash
pnpm run docker:db
```

Migrate the database:

```bash
pnpm run prisma:migrate
```

Generate the prisma client:

```bash
pnpm run prisma:generate
```

Run all apps in development mode:

```bash
pnpm run dev
```
