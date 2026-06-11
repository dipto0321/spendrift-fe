# Spendrift Frontend — Codex Context

## Project Overview

Spendrift is a modern personal finance tracking frontend application.

The project is initially built for personal use but architected to scale into a SaaS product later.

The focus is:

- Learning by building
- AI-assisted development
- Clean architecture
- Long-term maintainability
- Strong UX foundations

---

# Tech Stack

## Frontend

- TanStack Start
- React
- TypeScript
- TailwindCSS
- ShadCN UI

---

# Architecture Philosophy

The frontend follows:

- Domain-Driven Design (DDD)
- Feature-based architecture
- Modular frontend principles

---

# Frontend Structure

```bash
src/
 ├── app/
 │
 ├── features/
 │   ├── dashboard/
 │   ├── expenses/
 │   ├── budgets/
 │   ├── reports/
 │   └── trackers/
 │
 ├── shared/
 │   ├── ui/
 │   ├── hooks/
 │   ├── lib/
 │   └── utils/
 │
 └── styles/
```

---

# Frontend Rules

- Keep components small and readable
- Prefer composition over abstraction
- Avoid premature optimization
- Separate UI from business logic
- Build incrementally
- Keep domains cohesive
- Use mock data before backend integration
- Avoid unnecessary complexity

---

# Core Business Concept

The app is tracker-based.

Each tracker:

- Has its own currency
- Contains independent financial data
- Supports budgeting and reporting

Examples:

- Bangladesh Tracker (BDT)
- Europe Tracker (EUR)

---

# Features

## Expense Tracking

- Add/edit/delete expenses
- Needs vs Wants tagging
- Expense filtering
- Expense grouping

---

## Budgeting

- Monthly budget
- Savings target
- Remaining balance calculation
- Savings health indicator

---

## Reports

- Weekly reports
- Monthly reports
- Yearly reports
- Multi-year comparison
- Total/min/max/average analytics

---

## Future Features

- Investment tracking
- Loan tracking

---

# UI / UX Philosophy

Design should be:

- Minimal
- Calm
- Modern
- Fintech-inspired
- Data-focused

Inspired by:

- Linear
- Notion
- Modern SaaS dashboards

Dark theme first.

---

# Design Rules

- Prioritize readability
- Use spacing generously
- Avoid visual clutter
- Colors should communicate meaning
- Focus on usability before decoration

---

# Charting Rules

Always use ShadCN chart components.

Installation command:

```bash
pnpm dlx shadcn@latest add chart
```

Codex may customize chart implementations if necessary.

Avoid unnecessary chart abstraction.

---

# Shadcn components creation rules

use `pnpm dlx shadcn@latest add <component-name>` to create new components. follow official documentation for usage and customization. avoid creating custom components if existing ones can be composed to achieve the desired UI.

# Git Workflow Rules

After every meaningful implementation:

- Suggest a conventional commit
- Keep commits focused
- Auto-detect commit type

Examples:

- feat:
- fix:
- chore:
- refactor:
- docs:

Example:

```bash
feat(expenses): add expense list component
```

---

# AI-Assisted Development Philosophy

The developer wants to:

- Learn by coding
- Understand architecture deeply
- Avoid blind AI generation

Therefore:

- Always explain architectural decisions
- Explain complex logic clearly
- Prefer educational guidance
- Avoid over-engineering
- Suggest improvements with reasoning

---

# Preferred AI Behavior

Codex should behave like:

- A senior frontend engineer
- A frontend architect
- A code reviewer
- A pair programming assistant

Not:

- A blind code generator

---

# Important Rules

- Build features step-by-step
- Do not generate huge systems at once
- Prefer maintainability over cleverness
- Explain trade-offs clearly
- Keep implementation pragmatic
