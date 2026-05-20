# Mock Service Pattern

## Goal

Frontend development should begin before backend integration.

This improves:

- UI iteration speed
- component development
- UX experimentation

---

# Pattern

Each feature can contain mock services.

Example:

```bash
features/expenses/services/
```

---

# Example

```ts
export async function getExpenses() {
  return mockExpenses
}
```

---

# Rules

- Keep mock data realistic
- Match future backend response shape
- Avoid tightly coupling UI to mocks

---

# Benefits

- Faster frontend development
- Better UI isolation
- Easier testing
- Backend-independent workflow
