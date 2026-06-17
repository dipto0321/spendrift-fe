# Design System

## Design Philosophy

Spendrift follows:

- Minimal UI
- Calm fintech aesthetic
- Data clarity
- Low cognitive load

Inspired by:

- Linear
- Notion
- Modern fintech SaaS apps

---

# Theme Strategy

**Dark theme first.** Both dark and light variants ship; the default is dark and
an explicit user choice (stored) wins. We intentionally don't follow
`prefers-color-scheme` (it reports "light" for no-preference, which would defeat
dark-first).

Colors are defined as **`oklch` design tokens** in `src/styles.css` (a `:root`
light block and a `.dark` block), not hardcoded hex. The values below are
approximate references — `styles.css` is the source of truth.

---

# Palette

## Accent / Brand

- **Emerald** — `oklch(~0.68 0.13 162)` (light) / `oklch(~0.78 0.13 162)` (dark),
  exposed as `--primary`.

---

## Surfaces (dark)

- Background, card, and surface tokens are emerald-tinted neutrals
  (`--background`, `--card`, `--surface-strong`).

---

## Status Colors

- Success / on-track: Green
- Danger / over-budget: Red
- Warning / caution: Yellow

---

# Layout Rules

- Use generous spacing
- Avoid clutter
- Use card-based layouts
- Keep visual hierarchy strong

---

# Border Radius

- Cards: 12px
- Inputs: 10px
- Buttons: 10px

---

# Typography

- Clear hierarchy
- Avoid oversized text
- Prioritize readability

---

# UX Rules

- One primary focus per screen
- Minimize distractions
- Surface financial health clearly
- Colors should communicate meaning

---

# Mobile Philosophy (planned)

The current layout is a responsive **sidebar** workspace. A dedicated mobile
treatment is future work:

- Bottom navigation
- Stacked layouts
- Simplified charts
- Touch-friendly spacing
