# Smart Paste Regression Fix — Plan

> **Status:** Approved for execution.

## Reported issues

1. Smart paste no longer uses the AI like it used to.
2. Inputs are duplicated after saving.

## Root causes

### 1. AI fallback removed for anything not cleanly structured

`parseStructuredText` flips into "structured mode" whenever **any** line contains `=`. If a line then fails to parse (count mismatch, bad math, mixed free-text lines), it returns `{ kind: "invalid" }`, and `SmartPasteSection.handleParse` shows a hard error **instead of** falling back to the AI. So any paste that mixes free text with a `=` line — or any malformed structured line — never reaches the AI.

**Fix:** only use the deterministic (exact-math) path when the *entire* text parses cleanly. Otherwise fall back to the AI endpoint exactly as before (no hard error). `parseStructuredText` still distinguishes `invalid` for future use, but `handleParse` treats both `free-text` and `invalid` as "send to AI".

### 2. No re-entrancy guard → double-click duplicates

`handleParse` and the bulk "Save all" handler are async with no synchronous guard. A rapid double-click (especially the instant, synchronous structured-parse path, where the button never shows a pending state) fires the handler twice → parsed rows get appended twice → duplicate expenses after save.

**Fix:** add a `useRef`-based busy flag to both handlers (ref gives a synchronous guard; state gives UI feedback). The Parse button gains an `isParsing` state; the Save button keeps its existing `isSubmitting` UI but is additionally guarded against re-entry during the async validation window.

## Files to change

| File | Change |
|---|---|
| `src/features/expenses/presentation/SmartPasteSection.tsx` | ref+state busy guard; fall back to AI for `free-text` *and* `invalid` |
| `src/features/expenses/presentation/BulkExpenseForm.tsx` | ref-based save re-entrancy guard |

## Verification

- `pnpm test` (parser/splitter unit tests unchanged and still green).
- `biome check` on touched files.
- `tsc --noEmit` clean on touched files.
- Manual: free text pastes through AI again; mixed/malformed text falls back to AI instead of erroring; double-click Parse/Save no longer duplicates.

## Commit

- `fix(expenses): restore AI smart-paste fallback and prevent duplicate saves`
