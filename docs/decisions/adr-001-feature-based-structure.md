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
