---
name: create-mock-service
description: Scaffolds a typed in-memory mock API module (local array, async CRUD, simulated latency) that mirrors real HTTP shapes for frontend work. Use when adding mock data services, fake backends, simulating API delays, or when the user asks for getAll/create/update/delete mocks before a real API exists.
---

# Create Mock Service

## When this applies

Use when the user needs a **simple mock API** for a feature: typed entities, **async** `getAll` / `create` / `update` / `delete`, **artificial delay**, and a short **plan for swapping to a real backend** without rewriting UI.

## Agent behavior

1. **Explain before or alongside code** — file location, why the shape matches a real API, and how to replace the module later.
2. **Keep it simple** — one module, in-memory array, no extra frameworks (no MSW unless the user asks).
3. **Backend-ready** — export **types** and **async functions** with the same names/signatures you would keep when the implementation becomes `fetch` or server functions.

## Placement

Default path (feature-based, matches [create-tanstack-component](../create-tanstack-component/SKILL.md)):

```text
src/features/<feature-name>/api/mock<PluralEntity>.ts
```

Examples: `mockExpenses.ts`, `mockBudgets.ts`. Use `api/` (or `services/` if the repo already uses that name consistently).

If the feature name is unclear, **ask** before creating the file.

## Step-by-step workflow

### 1. Define types

- Export a **`type` or `interface`** for the domain entity (fields the UI needs).
- For `create`, use **`Omit<Entity, 'id'>`** (or equivalent) so callers do not fake server-generated ids.
- Keep ids as **`string`** if the real API will use UUIDs; use **`number`** only if that matches the planned backend.

### 2. Local data array

- Hold records in a **`let`** array in module scope (mutable mock “database”).
- Seed with a small static list so the UI has something to render immediately.

### 3. Simulate network delay

- Add a tiny helper, e.g. `delay(ms)` → `new Promise((r) => setTimeout(r, ms))`.
- **`await delay(200)`** (or similar) at the start of each public function — one place to tune perceived latency.

### 4. Implement async CRUD (mirror a real API)

Name and shape functions like a thin API client:

| Mock function | Typical real equivalent |
|---------------|------------------------|
| `getAll()` | `GET /entities` |
| `getById(id)` | `GET /entities/:id` (optional but useful) |
| `create(input)` | `POST /entities` |
| `update(id, patch)` | `PATCH /entities/:id` |
| `delete(id)` | `DELETE /entities/:id` |

Rules:

- Every exported operation is **`async`** and returns a **`Promise`**.
- **`create`**: generate `id` inside the mock (e.g. `crypto.randomUUID()` or incremental id); return the **full entity**.
- **`update`**: return **`null`** or throw a clear **`Error`** when id is missing — same contract you want from real HTTP (404-style).
- **`delete`**: return **`boolean`** or void; document the choice in the explanation.
- Avoid shared mutable objects leaking references: when returning lists, prefer **spreading** or **mapping** to new objects if consumers might mutate.

### 5. Future backend integration (always explain)

In the reply, state explicitly:

- **Today**: UI or TanStack Query calls this module’s async functions; behavior is in-memory and resets on full page reload unless persistence is added.
- **Later**: Replace the **function bodies** with:
  - **`fetch`** to REST routes, or
  - **TanStack Start** `createServerFn` handlers that talk to Prisma/DB.
- **Stable surface**: keep **type names**, **function names**, and **return shapes** so components and query hooks change minimally — only the implementation file (or an adapter) swaps.

If the project uses Sentry-instrumented server functions (see repo `.cursorrules`), note that **only real server implementations** need `Sentry.startSpan`; the mock module stays client- or shared-tree friendly without Sentry unless the user moves it server-side.

## Output format for the user

Deliver in this order:

1. **Short plan** — feature name, file path, entity name.
2. **Service file** — complete `mock<Plural>.ts` (types + delay + CRUD).
3. **Explanation** — delay tuning, error behavior, and the **swap path** to real HTTP or server functions.

## Reference template (adapt, do not copy blindly)

```ts
// Example shape only — adjust entity, fields, and id type to the feature.

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export type Widget = { id: string; name: string }

let widgets: Widget[] = [
  { id: '1', name: 'Alpha' },
  { id: '2', name: 'Beta' },
]

export async function getAllWidgets(): Promise<Widget[]> {
  await delay(200)
  return [...widgets]
}

export async function createWidget(input: Omit<Widget, 'id'>): Promise<Widget> {
  await delay(200)
  const widget: Widget = { ...input, id: crypto.randomUUID() }
  widgets = [...widgets, widget]
  return widget
}

export async function updateWidget(
  id: string,
  patch: Partial<Omit<Widget, 'id'>>,
): Promise<Widget | null> {
  await delay(200)
  const idx = widgets.findIndex((w) => w.id === id)
  if (idx === -1) return null
  const updated = { ...widgets[idx], ...patch }
  widgets = widgets.map((w) => (w.id === id ? updated : w))
  return updated
}

export async function deleteWidget(id: string): Promise<boolean> {
  await delay(200)
  const before = widgets.length
  widgets = widgets.filter((w) => w.id !== id)
  return widgets.length < before
}
```

## Anti-patterns

- Generic “repository framework” or dynamic proxies for a handful of entities.
- Mixing React hooks or UI into the service file.
- Returning the internal array reference from `getAll` (callers could mutate the mock store accidentally).
- Vague function names (`load`, `save`) that will not map cleanly to REST or server routes later.

## Checklist before finishing

- [ ] File lives under `src/features/<feature>/api/` (or justified alternative).
- [ ] Types exported; CRUD is async with simulated delay.
- [ ] Names and return shapes mirror a plausible real API.
- [ ] Explanation covers **today (mock)** vs **later (HTTP / server fn / DB)**.
- [ ] No unnecessary complexity.
