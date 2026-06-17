# ADR-001 — Feature-Based Frontend Structure

## Status

Accepted

---

# Context

The project requires:

- scalability
- maintainability
- strong domain boundaries
- SaaS-readiness

A simple component-folder structure would become difficult to maintain as the project grows.

---

# Decision

The frontend will follow:

- feature-based architecture
- DDD-inspired modular organization

Example:

```bash
features/
 ├── expenses/
 ├── budgets/
 ├── reports/
```

Each feature owns:

- components
- hooks
- services
- types
- utilities

---

# Consequences

## Positive

- Better scalability
- Easier reasoning
- Better ownership
- Cleaner boundaries

---

## Negative

- Slightly more structure initially
- Requires discipline

---

# Notes

Avoid over-engineering.

Refactor only when needed.

---

# Addendum (2026-06)

The decision stands. As realized, each feature is organized into three layers
rather than a flat `components/hooks/services/types/utilities` list:

- `domain/` — types + pure business logic (`services.ts`)
- `data/` — `repository.ts` (the API seam), `dto.ts` (wire mapping), `queryKeys.ts`
- `presentation/` — pages + TanStack Query hooks (`use*.ts`)

See [`docs/patterns/repository-pattern.md`](../patterns/repository-pattern.md).
