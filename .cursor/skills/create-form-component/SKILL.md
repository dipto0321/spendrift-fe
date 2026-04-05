---
name: create-form-component
description: Scaffolds a React TypeScript form with controlled inputs, useState for values, change/submit handlers, and simple inline validation, plus a short explanation of state flow. Avoids heavy form libraries. Use when adding or refactoring forms, controlled inputs, submit handling, basic validation, or when the user asks for a simple form without react-hook-form or similar.
---

# Create Form Component

## When this applies

Use when the user wants a **simple, controlled form** in this repo: **TypeScript**, **local state**, **submit + validation**, and a **clear explanation of data flow**. Do **not** use React Hook Form, Formik, Zod resolver stacks, or other complex form libraries unless the user explicitly asks.

## Agent behavior

1. **Explain before or alongside code** — field model, how state updates on change, what happens on submit, and how errors are set. Do not dump code without rationale.
2. **Keep logic obvious** — one object (or a few `useState` calls only if splitting is clearer), plain handlers, readable validation.
3. **Place consistently** — default: `src/features/<feature-name>/components/<FormName>.tsx` (same as [create-tanstack-component](../create-tanstack-component/SKILL.md)); routes import from features.

## Step-by-step workflow

### 1. Define fields

- Choose a **single TypeScript type** for “values” the form edits, e.g. `type ExpenseFormValues = { title: string; amount: string }`.
- Prefer **string** for text inputs and numeric fields typed as string until parse/submit (simpler controlled inputs); parse to number in `handleSubmit` if needed.
- Optional: a parallel type or map for **errors**, e.g. `Partial<Record<keyof ExpenseFormValues, string>>` or `Record<string, string>`.

### 2. Use `useState` for form data

- Initialize with **defaults** matching the field type: `useState<ExpenseFormValues>({ title: '', amount: '' })`.
- Keep **errors** in separate state if validating: `useState<...>({})`.
- Avoid mirroring the same value in two state variables.

### 3. Handle input changes

- One **`handleChange`** pattern: read `name` from the event (with typed `name` or a small helper), update the values object immutably:

  ```tsx
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }
  ```

- Wire **`name`**, **`value`**, and **`onChange`** on each control; use **`onBlur`** only if the user wants touch-based validation.

### 4. Handle submit

- **`handleSubmit`**: `e.preventDefault()`, optionally clear or set errors, run validation; if valid, call **`onSubmit` prop** or async mock (e.g. feature mock service) then reset or navigate as requested.
- Do not block the UI without feedback if submit is async — use local `isSubmitting` state when needed.

### 5. Basic validation

- **Inline functions** returning a boolean or an errors object; check required fields, min length, or simple patterns (e.g. positive number after `parseFloat`).
- Set error state and **return early** from `handleSubmit` when invalid.
- Keep messages **short** and field-specific. No schema libraries unless the user asks.

### 6. Explain state flow (required in the reply)

Cover in plain language:

1. **Initial render** — default `values` (and empty `errors`).
2. **User types** — `onChange` → `setValues` → re-render → inputs show new `value`.
3. **User submits** — `onSubmit` on `<form>` → `preventDefault` → validate → either set `errors` or proceed → optional async → reset or callback.

## UI and accessibility

- Use **semantic** `<form>`, `<label htmlFor>`, and **`id`** on inputs; associate errors with **`aria-invalid`** and **`aria-describedby`** when showing messages.
- Reuse existing **shadcn** or `src/components/` primitives if the repo already uses them; otherwise native inputs with minimal classes are fine.

## Output format for the user

1. **Short plan** — feature path, form name, fields list.
2. **State flow** — the bullet flow from section 6 (can be a short paragraph + list).
3. **Code** — the form component (and optional `onSubmit` typing).
4. **Optional** — one-line import example from a route if helpful.

## Anti-patterns

- Pulling in **react-hook-form**, **Formik**, **final-form**, or full **zod + resolver** stacks without an explicit user request.
- **Uncontrolled** inputs (`defaultValue` only) when the skill calls for controlled behavior — unless the user only wants a single uncontrolled field.
- Validating in render on every keystroke without need — prefer submit-time validation unless the user asks for live validation.
- Large generic “form builder” abstractions for a one-off screen.

## Checklist before finishing

- [ ] Field type + `useState` defaults are clear.
- [ ] Controlled inputs: `name`, `value`, `onChange` wired.
- [ ] Submit prevented, validated, then success path described.
- [ ] Explanation includes **state flow** (initial → change → submit).
- [ ] No complex form library; logic stays easy to read.
