# FinTrack Frontend Baseline

This repository is now cleaned from starter/demo content and prepared as the base for the FinTrack product implementation.

## Run locally

```bash
pnpm install
pnpm dev
```

## Build and test

```bash
pnpm build
pnpm test
```

## Core stack

- TanStack Start (React + SSR)
- TanStack Router (file-based routing)
- TanStack Query (server-state layer)
- Tailwind CSS 4
- Prisma + PostgreSQL (Neon-compatible)
- Paraglide (i18n)

## Project structure

- `src/routes`: route files and app shell (`__root.tsx`)
- `src/components`: shared UI components
- `src/integrations/tanstack-query`: query client/provider setup
- `src/paraglide`: generated i18n runtime output
- `prisma`: schema and seed scripts
- `messages`: i18n translation dictionaries

## Database commands

```bash
pnpm db:generate
pnpm db:push
pnpm db:migrate
pnpm db:studio
pnpm db:seed
```

## Quality checks

```bash
pnpm lint
pnpm format
pnpm check
```

## Next step

Define FinTrack requirements (entities, user flows, and MVP screens), then we can implement them in small, commit-sized slices.
