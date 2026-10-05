# Smart Paste Math Expressions + Bulk Date Edit — Implementation Plan

> **Status:** Draft — for review before implementation.
> **Goal:** (1) Teach smart paste to treat parenthesized portions as *math* (evaluated deterministically) and top-level `+` outside brackets as an *item separator*; (2) let the user multi-select expenses in the table and update *only* their dates in one pass.

---

## 1. Current architecture (context)

**Smart paste flow today**

```
SmartPasteSection (textarea + "Parse into rows")
  └─ useParseExpenses()                      src/features/expenses/presentation/useExpenses.ts
       └─ expenseParseRepository.parseText() src/features/expenses/data/repository.ts
            └─ POST /trackers/{id}/ai/parse-expenses   { text, default_date }
                 └─ backend modules/ai/service.py  → Gemini LLM → candidate rows
  └─ onParsed(rows) → BulkExpenseForm.handleParsed() → review grid → Save via useBulkCreateExpenses
```

- The AI (`_PROMPT_TEMPLATE` in `backend/modules/ai/service.py`) only extracts a "plain decimal amount string" — **no arithmetic**. An LLM is the wrong tool for math (unreliable), so math must be evaluated **deterministically in code**, not by the model.
- The review grid already forces the user to pick category/type before saving, so structured lines don't need the AI at all.

**Expense table / editing today**

- `ExpensePage` holds `sortedExpenses`, single-edit via `ExpenseModal`/`ExpenseForm` (`useUpdateExpense`), bulk-add via `BulkExpenseModal`.
- `ExpenseTable` → `ExpenseRow` (no selection; row click = edit, kebab menu = edit/delete).
- `expenseRepository.update(trackerId, id, patch)` already sends a **partial PATCH** (`toExpenseBody` only includes defined fields), and the backend `ExpenseUpdate` schema accepts `date` alone. **No backend change needed** for bulk date edit — we just fire N parallel PATCHes with `{ date }`.

---

## 2. Feature 1 — Math expressions in smart paste

### 2.1 The grammar (design decision)

The user's Excel convention maps to a small, unambiguous grammar:

```
<line>      := <labels> "=" <calc>
<labels>    := <label> ( "+" <label> )*          top-level "+" = item separator
<calc>      := <segment> ( "+" <segment> )*      top-level "+" (outside brackets) = item separator
<segment>   := a math expression: + - * / ( ) , decimals, optional unary "-"
<label>     := free text (may contain "and", spaces, digits — trimmed, non-empty)
```

**Rules**

1. `=` (first occurrence on a line) separates the *description side* from the *calculation side*.
2. On **both** sides, a `+` at bracket-depth 0 is an **item separator**.
3. Everything inside `(...)` (any nesting) is **math** and is evaluated to a single number.
4. The i-th description label pairs with the i-th calculation segment. **Counts must match.**
5. One line → **N expense rows** (one per item).

**Examples**

| Input | Rows produced |
|---|---|
| `Item 1 + Item 2 = 100 + 200` | 2 rows: `Item 1`→100, `Item 2`→200 |
| `Item 1 and 2 + item 3 = (100 + 200) + 50` | 2 rows: `Item 1 and 2`→300, `item 3`→50 |
| `Groceries = (100 + 200)` | 1 row: `Groceries`→300 |
| `Pens = ((5*6)+(89-50)+(40/2)-50)` | 1 row: `Pens`→39 |
| `Taxi = (20 * 2) + 5` | 2 rows: `Taxi`→(20*2)=40, ``→5 → **invalid (mismatch)** |

**Gotchas to document for the user (in the UI hint)**

- A single item with multiple amounts must be **wrapped in brackets**: `Groceries = (100 + 200)`, not `Groceries = 100 + 200`.
- Use `*` for multiply and `/` for divide; `2(3+4)` is *not* supported (must write `2*(3+4)`).
- Commas (`1,000`) and currency symbols (`$50`, `৳100`) are stripped before evaluation.

### 2.2 Where the logic lives (decision)

**Frontend, deterministic, pure functions** — no AI, no backend change.

- The parser/evaluator is a set of pure TS functions in the expense domain, unit-tested with vitest (matches the repo's "pure functions only" test rule).
- `SmartPasteSection.handleParse` becomes a small decision tree:

```
text = trim(input)
if text has no "=" anywhere            → existing AI path (free text like "coffee 120, bus 40")
else                                     → structured mode:
    result = parseStructuredText(text, defaultDate)
    ok            → onParsed(rows); clear text           (no AI call)
    invalid(line) → toast "Line N could not be parsed"; keep text
```

- Structured mode **never falls back to the AI** (math must be exact); invalid structured input shows a clear error instead.

### 2.3 New module interfaces

**New file `src/features/expenses/domain/expression.ts`** (pure, no imports beyond nothing)

```ts
// Evaluates an arithmetic expression: + - * / ( ) , unary minus, decimals.
// Throws on malformed input or division by zero.
export function evaluateExpression(expr: string): number;
```

Implementation: recursive descent over a token stream:

```
expression := term (("+" | "-") term)*
term       := unary (("*" | "/") unary)*
unary      := ("-" unary) | primary
primary    := NUMBER | "(" expression ")"
```

Pre-tokenization: strip `$ € £ ৳` and thousands `,`; number literal = `\d+(\.\d+)?` or `\.\d+`. Standard precedence (`*`/`/` before `+`/`-`), left-associative, unary `-` supported.

**New file `src/features/expenses/domain/smartPaste.ts`** (pure; imports `ParsedExpense` from `./types`)

```ts
// Split on top-level "+" (bracket depth 0), ignoring "+" inside (...).
export function splitTopLevel(input: string): string[];

// Parse one "<labels> = <calc>" line into item rows; null on any mismatch.
export function parseStructuredLine(line: string): { description: string; amount: number }[] | null;

export type StructuredParseResult =
  | { kind: "free-text" }              // no "=" anywhere → route to AI
  | { kind: "invalid"; line: number }  // had "=" but a line failed (bad math / count mismatch)
  | { kind: "ok"; rows: ParsedExpense[] };

// Whole-text entry point. Rows get date = defaultDate, type = "need",
// categoryId = undefined (review grid forces category pick).
export function parseStructuredText(text: string, defaultDate: string): StructuredParseResult;
```

`parseStructuredLine` algorithm:
1. `idx = line.indexOf("=")`; if `idx < 0` → `null`.
2. `labels = splitTopLevel(line.slice(0, idx)).map(trim)`, `segments = splitTopLevel(line.slice(idx + 1)).map(trim)`.
3. Filter out empty labels/segments.
4. If `labels.length === 0 || labels.length !== segments.length` → `null`.
5. `amounts = segments.map(evaluateExpression)` (throws → `null`).
6. Zip into `{ description, amount }[]`.

### 2.4 Tasks (Feature 1)

#### Task F1-1: Expression evaluator (TDD)

- Create `src/features/expenses/domain/expression.ts` + `expression.test.ts`.
- Tests (all pure): precedence `2+3*4`→14, parens `(2+3)*4`→20, user example `((5*6)+(89-50)+(40/2)-50)`→39, `(100+200)+50`→350, unary `-50+100`→50, division `10/4`→2.5, comma `1,000+500`→1500, currency `$50+30`→80, decimals `.5+1`→1.5, division-by-zero throws, malformed throws.

#### Task F1-2: Smart-paste splitter + line parser (TDD)

- Create `src/features/expenses/domain/smartPaste.ts` + `smartPaste.test.ts`.
- Tests: `splitTopLevel("(a + b) + c")`→`["(a + b)","c"]`; `splitTopLevel("a + b")`→`["a","b"]`; `splitTopLevel("((5*6)+(89-50)+(40/2)-50)")`→single element; `parseStructuredLine("Item 1 and 2 + item 3 = (100 + 200) + 50")`→`[{Item 1 and 2,300},{item 3,50}]`; `parseStructuredText` returns `free-text`/`invalid`/`ok` correctly for the examples in §2.1.

#### Task F1-3: Wire into `SmartPasteSection`

- Modify `src/features/expenses/presentation/SmartPasteSection.tsx` `handleParse` to the §2.2 decision tree.
- Structured rows call `onParsed(rows)` directly (skipping `useParseExpenses`); free-text keeps the existing AI call.
- Add an inline `sonner` toast for `invalid` results (reuse the existing toast import pattern).
- Update the placeholder/hint to advertise the `=` syntax (see §4 idea #2 for a live-preview polish, optional here).

#### Task F1-4: Verify + commit

- `pnpm check && pnpm test`.
- Commit: `feat(expenses): evaluate math expressions in smart paste`.

---

## 3. Feature 2 — Bulk date edit (multi-select, dates only)

### 3.1 Design

- Add **row selection** to the expense table (checkbox column + "select all" header).
- When ≥1 row is selected, show a **contextual action bar**: "N selected · Change date · Clear".
- "Change date" opens a **date-only dialog** (a single `DatePicker`, nothing else) — this is what enforces *dates only*: there is no other field to edit.
- On apply: fire one `PATCH { date }` per selected id in parallel, then clear selection.

### 3.2 State & data flow

- Selection state lives in `ExpensePage`: `const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())`.
- Passed down to `ExpenseTable` → `ExpenseRow` as props (no context needed).
- New hook `useBulkUpdateExpenseDates(trackerId)` mirrors `useBulkCreateExpenses`:
  `Promise.allSettled` over `expenseRepository.update(trackerId, id, { date })` → `partitionSettled` → toast + invalidate `expenseKeys.all`.
- Clear selection automatically: after success, and whenever the filter/page changes (so we never act on rows that are no longer visible).

### 3.3 New/changed components

| File | Change |
|---|---|
| `src/features/expenses/presentation/ExpensePage.tsx` | selection state + handlers; action bar; `BulkDateEditModal` wiring; `useBulkUpdateExpenseDates`; clear selection on filter/page change |
| `src/features/expenses/presentation/ExpenseTable.tsx` | new leading checkbox column + select-all header; new props `selectedIds`, `onToggleSelect`, `onToggleSelectAll` |
| `src/features/expenses/presentation/ExpenseRow.tsx` | new leading checkbox cell (click = toggle select, `stopPropagation` so it doesn't open the edit modal); `selected` highlight |
| `src/features/expenses/presentation/useExpenses.ts` | add `useBulkUpdateExpenseDates` |
| `src/features/expenses/presentation/BulkDateEditModal.tsx` | new: `DatePicker`-only dialog |
| `src/components/ui/checkbox.tsx` | add via shadcn (not currently present) |

### 3.4 Interaction rules

- **Row body click** still opens the single-edit modal (unchanged). Only the **checkbox** toggles selection.
- Bulk date modal exposes **only a date** — amount/category/type/description are never present, satisfying "only dates" by construction.
- Select-all applies to the current filtered/sorted page; it toggles on/off.
- Partial failures: report `failed` count via toast (consistent with bulk create); don't clear the rows that failed.

### 3.5 Tasks (Feature 2)

#### Task F2-1: Add the checkbox component

```bash
pnpm dlx shadcn@latest add checkbox
```

#### Task F2-2: `useBulkUpdateExpenseDates` hook

- Add to `src/features/expenses/presentation/useExpenses.ts` (reuses `partitionSettled` + `expenseKeys`).
- Signature: `mutateAsync({ ids: string[]; date: string }) => Promise<BulkCreateResult>` (reuse the same result shape).

#### Task F2-3: Selection in the table

- Extend `ExpenseTable` + `ExpenseRow` with checkbox selection + select-all + selected styling.

#### Task F2-4: Bulk date modal + action bar + page wiring

- Create `BulkDateEditModal.tsx` (DatePicker + Apply/Cancel).
- In `ExpensePage`: selection state, action bar (visible when `selectedIds.size > 0`), modal wiring, clear-selection lifecycle.

#### Task F2-5: Verify + commit

- `pnpm check && pnpm test`; manual dev-server pass (select 2+ rows → change date → both update; only date changes).
- Commit: `feat(expenses): bulk edit dates for selected rows`.

---

## 4. Ideas to make smart paste more user-friendly (ranked)

1. **Live preview** — parse rows as the user types (debounced), showing a small "N rows detected" preview under the textarea before clicking Parse.
2. **Inline result echo** — for structured lines, show the evaluation next to each segment, e.g. `(5*6)+(89-50)+(40/2)-50 → 39.00` so mistakes are visible at a glance.
3. **Tab/CSV paste + Google Sheets** — detect tab-separated clipboard data (Excel/Sheets pastes as TSV) and map columns automatically (`details | calc | date | need/want`). This is the highest-value idea for your Sheets workflow.
4. **Category/type memory** — remember the last category/type per description keyword so future pastes auto-fill them (turns the review grid into a confirm, not a fill-in).
5. **Need/want inline markers** — parse a trailing `want`/`need` (e.g. `coffee 120 want`) as the type; the backend prompt already supports this for free text, extend it to structured lines.
6. **Date shortcuts** — support `today`, `yesterday`, and `12/10` / `12 Oct` in the pasted text.
7. **Duplicate detection** — warn when a parsed row matches an existing expense (same description + amount + date), and offer to skip it.
8. **CSV file import** — accept an uploaded `.csv` (extension of idea #3).
9. **Rounding display** — round evaluated results to 2 decimals (backend already quantizes to `0.01`) and show the rounding in the preview.
10. **Templates / snippets** — save reusable paste patterns (e.g. a monthly "grocery run" template).

Recommended next after this plan: **#3 (tab/CSV paste)** — it directly bridges Google Sheets ↔ this app, which is your stated goal.

---

## 5. Constraints & testing

- All data access through `features/expenses/data/repository.ts`; no direct `fetch`/`apiFetch` in pages/hooks.
- dto boundary: wire is snake_case + decimal-string money; domain is camelCase + `number` (unchanged — structured parsing produces domain rows directly).
- Tests: vitest, **pure functions only** (`expression.ts`, `smartPaste.ts`). No component/hook tests.
- Formatting: tabs + biome — `pnpm check` before each commit.
- New ShadCN components only via `pnpm dlx shadcn@latest add <name>` (currently needed: `checkbox`).
- No backend change required for either feature (bulk date edit reuses partial `PATCH`; structured smart paste is client-side).

## 6. Branching & commits (suggested)

Two independent feature branches, conventional commits:

```bash
git checkout -b feat/expense-smart-paste-math      # Feature 1
git checkout -b feat/expense-bulk-date-edit        # Feature 2
```

- `feat(expenses): evaluate math expressions in smart paste`
- `feat(expenses): bulk edit dates for selected rows`
