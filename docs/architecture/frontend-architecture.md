# Frontend Architecture

## Architecture Style

The frontend follows:

- Domain-Driven Design (DDD)
- Feature-based architecture
- Shared UI primitives

---

# Goals

- Scalability
- Maintainability
- Reusability
- Strong separation of concerns
- Clean domain boundaries

---

# Main Structure

```bash
src/
 ├── app/
 ├── features/
 ├── shared/
 └── styles/
```

---

# Domains

## dashboard

Responsible for:

- overview UI
- dashboard widgets
- summary cards

---

## expenses

Responsible for:

- expense list
- expense form
- expense filters
- expense calculations

---

## budgets

Responsible for:

- budget setup
- savings targets
- budget status

---

## reports

Responsible for:

- analytics
- charts
- yearly comparison
- report summaries

---

## trackers

Responsible for:

- tracker selection
- currency-specific workspace
- tracker settings

---

# Shared Layer

## shared/ui

Reusable UI primitives:

- Button
- Card
- Input
- Modal
- Badge

---

## shared/hooks

Reusable hooks.

---

## shared/lib

Utilities and helper libraries.

---

## shared/utils

Pure helper functions.

---

# State Management Philosophy

Initially:

- Local component state
- Minimal global state

Avoid introducing complex state libraries too early.

---

# Mock Data Strategy

Frontend should initially use:

- mock services
- local fake data
- static fixtures

Before backend integration.

---

# Routing Philosophy

Routes should remain:

- minimal
- readable
- feature-oriented

---

# Design Philosophy

The application should feel:

- calm
- modern
- minimal
- data-focused

---

# Scalability Strategy

Start simple.

Refactor only when:

- duplication becomes painful
- complexity becomes repeated
- scaling requires abstraction

Avoid premature optimization.
