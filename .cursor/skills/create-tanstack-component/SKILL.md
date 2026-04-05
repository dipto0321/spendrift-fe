---
name: create-tanstack-component
description: Creates React TypeScript components using TanStack Start conventions inside a feature-based layout (features/<feature-name>/), with simple UI and teaching-style explanations of placement, state, and future API wiring. Use when adding or scaffolding UI in a feature folder, building FinTrack screens, or when the user asks for a TanStack Start component with explanations.
---

# Create TanStack Component

## When this applies

Use this workflow when the user wants a **new React component** in this repo: feature-first placement, **functional components**, **TypeScript**, **readable** code, **light structure** (not heavy styling), and **mock data** until a real API exists.

## Agent behavior (non-negotiable)

1. **Explain before or alongside code** — placement, state, and how to hook up data later. Do not dump code without rationale.
2. **Keep code simple** — no advanced patterns (render props, heavy HOCs, deep generic abstractions) unless the user explicitly needs them.
3. **Prefer small, obvious pieces** — one component, clear props, local state unless sharing is required.

## Step-by-step workflow

### 1. Identify the feature folder

- Default path: `src/features/<feature-name>/` (e.g. `src/features/expenses/`).
- If the user names a domain (e.g. “expenses”, “budgets”), map it to **one** kebab-case or lowercase folder name and use it consistently.
- If unclear, **ask** which feature owns the UI before creating files.

### 2. Choose file location and name

Recommended layout (scales as features grow):

```text
src/features/<feature-name>/
  components/
    <ComponentName>.tsx    # presentational / screen sections
```

- **Why `components/` inside the feature**: keeps everything for that domain together; routes stay thin and import from here.
- **File name**: `PascalCase` matching the default export (e.g. `ExpenseSummary.tsx`).

Optional (only when needed):

- `src/features/<feature-name>/api/` or `.../services/` — mock functions and types (e.g. `mockExpenses.ts`).
- Hooks later: `src/features/<feature-name>/hooks/` — only when multiple components share logic.

### 3. Define props

- Add a **`type` or `interface`** for props at the top of the file (or next to the component).
- Prefer **explicit, minimal** props; avoid `...rest` spreading unless there is a concrete need.
- Use optional props with defaults or clear `?` types when sensible.

### 4. Implement as a functional component

- Use `function ComponentName(props: Props)` or `export function ComponentName(...)`.
- No class components.

### 5. State and logic

- **Local UI state** → `useState` (forms, toggles, selected row).
- **Derived values** → compute in render; do not mirror props in state.
- **Shared state across siblings** → lift state to the **parent** (often the route component) and pass props/callbacks — still avoid global stores until needed.
- **Later (real API)** → TanStack Query in a parent or a small hook that calls `fetch` / server functions; keep this component mostly presentational when possible.

Explain in the reply **which of the above** applies and why.

### 6. UI structure

- Use **semantic HTML** (`section`, `header`, `ul`/`li`, `button`) and **minimal** classes.
- Reuse existing primitives from `src/components/` or shadcn-style UI if the project already uses them; **do not** introduce heavy styling systems in the skill output unless the user asks.
- Avoid layout frameworks beyond what the repo already uses.

### 7. TanStack Start integration

- **Route files** stay under `src/routes/` (file-based routing).
- **Feature UI** lives under `src/features/...`; routes **import** and compose those components.
- Do not move `createFileRoute` definitions into `features/` unless the project already follows a different convention (match the repo).

### 8. Mock API now, real API later

- Place **mock data and mock async functions** next to the feature (e.g. `api/mockExpenses.ts`) returning typed objects / `Promise` delays.
- In the explanation, state clearly:
  - **Today**: component receives data via **props** from a parent that calls mocks, or calls a mock function in `useEffect` (only if necessary for the demo).
  - **Later**: replace the mock module with **real fetch** or **TanStack Start server functions** (`createServerFn`, etc.) and optionally **TanStack Query** for caching; the **component shape** (props / displayed fields) should stay stable.

## Output format for the user

Deliver in this order:

1. **Short plan** — feature folder, file path, component name.
2. **Decisions** — why that folder; how state is handled; how API wiring will swap in later.
3. **Code** — the component (and mock helper only if needed).
4. **Optional** — one-line example of importing the component from a route (no full route rewrite unless requested).

## Anti-patterns (do not do)

- Large “god” components mixing unrelated concerns.
- Premature `useReducer`, context providers, or state machines for trivial UI.
- Abstractions like “generic data table” unless the user asked for reusability across features.
- Full-file dumps with no explanation (violates project rules).

## Checklist before finishing

- [ ] Path is under `src/features/<feature>/components/` (or justified alternative).
- [ ] TypeScript props are explicit and minimal.
- [ ] Functional component only; logic is easy to follow.
- [ ] Explanation covers **placement**, **state**, and **future API** connection.
- [ ] No unnecessary complexity.
