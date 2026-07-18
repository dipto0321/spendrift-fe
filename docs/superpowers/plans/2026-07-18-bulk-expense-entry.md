# Bulk Expense Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user add many same-day expenses in one sitting — a batch grid (Phase 1, frontend-only) plus an AI "smart paste" that pre-fills the grid from free text (Phase 2, via a FastAPI proxy).

**Architecture:** Phase 1 adds a `BulkExpenseModal` (shared date + `useFieldArray` row grid) that saves via `Promise.allSettled` over the existing `expenseRepository.create` — per-row failure keeps the row in the grid for retry. Phase 2 adds a `POST /ai/parse-expenses` seam (`expenseParseRepository`) whose parsed rows are appended to the same grid for mandatory review; the AI never writes to the API directly.

**Tech Stack:** React 19, TanStack Query, react-hook-form + zod (`useFieldArray`), ShadCN UI, vitest, biome.

**Spec:** `docs/superpowers/specs/2026-07-18-bulk-expense-entry-design.md`

## Global Constraints

- All data access through `features/expenses/data/repository.ts` — no direct `fetch`/`apiFetch` in pages, hooks, or components (SPEC V1).
- dto boundary rules (SPEC V14): wire is snake_case + decimal-string money; domain is camelCase + `number`. Conversion happens only in `data/dto.ts`.
- Row validation = SPEC V10: amount > 0 and numeric; category, description non-empty.
- Tests: vitest, pure functions only (domain services / schema / dto mapping). No component or hook tests.
- Formatting: tabs, biome — run `pnpm check` before each commit; fix what it reports.
- Charts/UI: compose existing ShadCN components; new ShadCN components only via `pnpm dlx shadcn@latest add <name>`.
- Branch: all work on `feat/bulk-expense-entry`, cut from `main`. Conventional commits.
- Phase 2 frontend is buildable without the backend (Parse button surfaces an error toast until `POST /ai/parse-expenses` exists), but end-to-end verification needs the backend endpoint deployed.

---

### Task 1: Branch + bulk form schema

**Files:**
- Modify: `src/features/expenses/domain/schema.ts`
- Test: `src/features/expenses/domain/schema.test.ts` (create)

**Interfaces:**
- Consumes: existing `expenseFormSchema` in `domain/schema.ts`.
- Produces: `bulkExpenseRowSchema`, `bulkExpenseFormSchema`, `isBlankBulkRow(row): boolean`, types `BulkExpenseRowValues`, `BulkExpenseFormValues`. Later tasks import all of these from `../domain/schema`.

- [ ] **Step 1: Cut the branch**

```bash
git checkout main && git pull && git checkout -b feat/bulk-expense-entry
```

- [ ] **Step 2: Write the failing tests**

Create `src/features/expenses/domain/schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
	type BulkExpenseRowValues,
	bulkExpenseFormSchema,
	isBlankBulkRow,
} from "./schema";

function row(overrides: Partial<BulkExpenseRowValues> = {}): BulkExpenseRowValues {
	return {
		amount: "120.50",
		categoryId: "c1",
		description: "coffee",
		type: "want",
		...overrides,
	};
}

describe("bulkExpenseFormSchema", () => {
	it("accepts a date plus one or more valid rows", () => {
		const result = bulkExpenseFormSchema.safeParse({
			date: "2026-07-18",
			rows: [row(), row({ amount: "40", type: "need" })],
		});
		expect(result.success).toBe(true);
	});

	it("rejects an empty rows array", () => {
		const result = bulkExpenseFormSchema.safeParse({
			date: "2026-07-18",
			rows: [],
		});
		expect(result.success).toBe(false);
	});

	it("rejects a missing date", () => {
		const result = bulkExpenseFormSchema.safeParse({
			date: "",
			rows: [row()],
		});
		expect(result.success).toBe(false);
	});

	it("rejects a row with a non-positive amount", () => {
		const result = bulkExpenseFormSchema.safeParse({
			date: "2026-07-18",
			rows: [row({ amount: "0" })],
		});
		expect(result.success).toBe(false);
	});

	it("rejects a row with a missing category or description", () => {
		expect(
			bulkExpenseFormSchema.safeParse({
				date: "2026-07-18",
				rows: [row({ categoryId: "" })],
			}).success,
		).toBe(false);
		expect(
			bulkExpenseFormSchema.safeParse({
				date: "2026-07-18",
				rows: [row({ description: "  " })],
			}).success,
		).toBe(false);
	});

	it("rows carry no date field — the batch date is shared", () => {
		const parsed = bulkExpenseFormSchema.parse({
			date: "2026-07-18",
			rows: [row()],
		});
		expect("date" in parsed.rows[0]).toBe(false);
	});
});

describe("isBlankBulkRow", () => {
	it("is true only when amount, description, and category are all empty", () => {
		expect(
			isBlankBulkRow({ amount: "", categoryId: "", description: "", type: "need" }),
		).toBe(true);
		expect(
			isBlankBulkRow({ amount: " ", categoryId: "", description: "  ", type: "want" }),
		).toBe(true);
		expect(
			isBlankBulkRow({ amount: "5", categoryId: "", description: "", type: "need" }),
		).toBe(false);
		expect(
			isBlankBulkRow({ amount: "", categoryId: "c1", description: "", type: "need" }),
		).toBe(false);
		expect(
			isBlankBulkRow({ amount: "", categoryId: "", description: "x", type: "need" }),
		).toBe(false);
	});
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test src/features/expenses/domain/schema.test.ts`
Expected: FAIL — `bulkExpenseFormSchema` / `isBlankBulkRow` not exported.

- [ ] **Step 4: Implement the schema**

Append to `src/features/expenses/domain/schema.ts`:

```ts
// Bulk entry: one shared date for the whole batch, each row re-uses the
// single-expense field rules (V10) minus the per-row date.
export const bulkExpenseRowSchema = expenseFormSchema.omit({ date: true });

export type BulkExpenseRowValues = z.infer<typeof bulkExpenseRowSchema>;

export const bulkExpenseFormSchema = z.object({
	date: z.string().min(1, "Date is required"),
	rows: z.array(bulkExpenseRowSchema).min(1, "Add at least one expense"),
});

export type BulkExpenseFormValues = z.infer<typeof bulkExpenseFormSchema>;

// A row the user never touched: safe to drop silently before validating so
// unused starter rows don't block Save.
export function isBlankBulkRow(row: BulkExpenseRowValues): boolean {
	return (
		row.amount.trim() === "" &&
		row.description.trim() === "" &&
		row.categoryId === ""
	);
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test src/features/expenses/domain/schema.test.ts`
Expected: PASS (all tests).

- [ ] **Step 6: Commit**

```bash
pnpm check
git add src/features/expenses/domain/schema.ts src/features/expenses/domain/schema.test.ts
git commit -m "feat(expenses): add bulk expense form schema"
```

---

### Task 2: `partitionSettled` domain service

**Files:**
- Modify: `src/features/expenses/domain/services.ts`
- Test: `src/features/expenses/domain/services.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `partitionSettled<T>(results: PromiseSettledResult<T>[]): { succeeded: number[]; failed: number[] }` and exported type `BulkCreateResult = { succeeded: number[]; failed: number[] }`. Task 3's hook returns `BulkCreateResult`; Tasks 4–5 consume it.

- [ ] **Step 1: Write the failing test**

Append to `src/features/expenses/domain/services.test.ts` (keep existing imports; add `partitionSettled` to the `./services` import list):

```ts
describe("partitionSettled", () => {
	it("splits settled results into succeeded and failed index lists", () => {
		const results: PromiseSettledResult<string>[] = [
			{ status: "fulfilled", value: "a" },
			{ status: "rejected", reason: new Error("boom") },
			{ status: "fulfilled", value: "c" },
		];
		expect(partitionSettled(results)).toEqual({
			succeeded: [0, 2],
			failed: [1],
		});
	});

	it("handles all-success and all-failure batches", () => {
		expect(
			partitionSettled([{ status: "fulfilled", value: 1 }]),
		).toEqual({ succeeded: [0], failed: [] });
		expect(
			partitionSettled([{ status: "rejected", reason: "x" }]),
		).toEqual({ succeeded: [], failed: [0] });
		expect(partitionSettled([])).toEqual({ succeeded: [], failed: [] });
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/features/expenses/domain/services.test.ts`
Expected: FAIL — `partitionSettled` is not exported.

- [ ] **Step 3: Implement**

Append to `src/features/expenses/domain/services.ts`:

```ts
export type BulkCreateResult = {
	succeeded: number[];
	failed: number[];
};

// Index-based partition of Promise.allSettled results so the bulk-save UI can
// keep failed rows (by position) in the grid for retry.
export function partitionSettled<T>(
	results: PromiseSettledResult<T>[],
): BulkCreateResult {
	const succeeded: number[] = [];
	const failed: number[] = [];
	results.forEach((result, index) => {
		(result.status === "fulfilled" ? succeeded : failed).push(index);
	});
	return { succeeded, failed };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/features/expenses/domain/services.test.ts`
Expected: PASS (existing + new tests).

- [ ] **Step 5: Commit**

```bash
pnpm check
git add src/features/expenses/domain/services.ts src/features/expenses/domain/services.test.ts
git commit -m "feat(expenses): add partitionSettled for bulk save results"
```

---

### Task 3: `useBulkCreateExpenses` hook

**Files:**
- Modify: `src/features/expenses/presentation/useExpenses.ts`

**Interfaces:**
- Consumes: `expenseRepository.create(trackerId, input)` (existing), `partitionSettled` + `BulkCreateResult` from Task 2, `expenseKeys` (existing).
- Produces: `useBulkCreateExpenses(trackerId: string | undefined)` — a TanStack mutation whose `mutateAsync(inputs: ExpenseCreateInput[])` resolves to `BulkCreateResult`. Never rejects for per-row API failures (only if the whole call throws synchronously). Tasks 4–5 call it via `mutateAsync`.

No unit test (hooks are out of test scope per SPEC §C); `pnpm check` + the app build verify types.

- [ ] **Step 1: Implement the hook**

In `src/features/expenses/presentation/useExpenses.ts`, extend the domain import and add the hook:

```ts
import { type BulkCreateResult, partitionSettled } from "../domain/services";
```

Append after `useCreateExpense`:

```ts
// Bulk add: fire one POST per row in parallel and report which input indexes
// failed so the modal can keep those rows for retry. Per-row failures resolve
// (not reject) — the caller inspects `failed`.
export function useBulkCreateExpenses(trackerId: string | undefined) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (
			inputs: ExpenseCreateInput[],
		): Promise<BulkCreateResult> => {
			const results = await Promise.allSettled(
				inputs.map((input) =>
					expenseRepository.create(trackerId as string, input),
				),
			);
			return partitionSettled(results);
		},
		onSuccess: ({ succeeded, failed }) => {
			if (succeeded.length > 0) {
				queryClient.invalidateQueries({
					queryKey: expenseKeys.all(trackerId as string),
				});
			}
			if (failed.length === 0) {
				toast.success(
					succeeded.length === 1
						? "Expense added"
						: `${succeeded.length} expenses added`,
				);
			} else {
				toast.error(
					`${failed.length} of ${failed.length + succeeded.length} expenses failed to save.`,
				);
			}
		},
	});
}
```

- [ ] **Step 2: Verify types and lint**

Run: `pnpm check && pnpm test`
Expected: biome clean; all existing tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/expenses/presentation/useExpenses.ts
git commit -m "feat(expenses): add useBulkCreateExpenses mutation"
```

---

### Task 4: `BulkExpenseForm` grid component

**Files:**
- Create: `src/features/expenses/presentation/BulkExpenseForm.tsx`

**Interfaces:**
- Consumes: `bulkExpenseFormSchema`, `isBlankBulkRow`, `BulkExpenseFormValues`, `BulkExpenseRowValues` (Task 1); `BulkCreateResult` (Task 2); `Category`, `ExpenseCreateInput` (existing types); ShadCN `Form/Input/Select/Button`, `DatePicker` (existing).
- Produces: `BulkExpenseForm` with props `{ categories: Category[]; onSubmit: (inputs: ExpenseCreateInput[]) => Promise<BulkCreateResult>; onCancel: () => void; isSubmitting?: boolean }`. On partial failure it prunes succeeded rows and shows a retry banner; the parent decides when to close (full success). Task 5 renders it. Task 8 adds smart paste inside this file via `replaceRows`.

- [ ] **Step 1: Create the component**

Create `src/features/expenses/presentation/BulkExpenseForm.tsx`:

```tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/shared/ui/DatePicker";
import {
	type BulkExpenseFormValues,
	type BulkExpenseRowValues,
	bulkExpenseFormSchema,
	isBlankBulkRow,
} from "../domain/schema";
import type { BulkCreateResult } from "../domain/services";
import type { Category, ExpenseCreateInput } from "../domain/types";

type BulkExpenseFormProps = {
	categories: Category[];
	onSubmit: (inputs: ExpenseCreateInput[]) => Promise<BulkCreateResult>;
	onCancel: () => void;
	isSubmitting?: boolean;
};

const emptyRow = (): BulkExpenseRowValues => ({
	amount: "",
	categoryId: "",
	description: "",
	type: "need",
});

export function BulkExpenseForm({
	categories,
	onSubmit,
	onCancel,
	isSubmitting,
}: Readonly<BulkExpenseFormProps>) {
	const form = useForm<BulkExpenseFormValues>({
		resolver: zodResolver(bulkExpenseFormSchema),
		defaultValues: {
			date: new Date().toISOString().split("T")[0],
			rows: [emptyRow(), emptyRow(), emptyRow()],
		},
	});
	const { fields, append, remove, replace } = useFieldArray({
		control: form.control,
		name: "rows",
	});
	const [failedCount, setFailedCount] = useState(0);

	const selectableCategories = categories.filter(
		(c) => c.name !== "Uncategorized",
	);

	async function submitRows(values: BulkExpenseFormValues) {
		setFailedCount(0);
		const inputs: ExpenseCreateInput[] = values.rows.map((row) => ({
			amount: Number.parseFloat(row.amount),
			categoryId: row.categoryId,
			date: values.date,
			description: row.description,
			type: row.type,
		}));
		const { failed } = await onSubmit(inputs);
		if (failed.length > 0) {
			const failedSet = new Set(failed);
			replace(values.rows.filter((_, index) => failedSet.has(index)));
			setFailedCount(failed.length);
		}
	}

	// Untouched starter rows shouldn't block Save: prune them from the field
	// array first so validation and failure indexes line up with what's visible.
	function handleSaveClick() {
		const rows = form.getValues("rows");
		const keep = rows.filter((row) => !isBlankBulkRow(row));
		if (keep.length !== rows.length) {
			replace(keep.length > 0 ? keep : [emptyRow()]);
		}
		void form.handleSubmit(submitRows)();
	}

	function handleRowKeyDown(
		event: React.KeyboardEvent<HTMLDivElement>,
		index: number,
	) {
		if (event.key !== "Enter") return;
		if (!(event.target instanceof HTMLInputElement)) return;
		event.preventDefault();
		if (index === fields.length - 1) append(emptyRow());
	}

	return (
		<Form {...form}>
			<form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
				<FormField
					control={form.control}
					name="date"
					render={({ field }) => (
						<FormItem className="max-w-xs">
							<FormLabel>
								Date <span className="text-destructive">*</span>
							</FormLabel>
							<FormControl>
								<DatePicker value={field.value} onChange={field.onChange} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{failedCount > 0 && (
					<p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
						{failedCount} {failedCount === 1 ? "expense" : "expenses"} failed to
						save. The rows below were kept — fix or remove them, then save
						again.
					</p>
				)}

				<div className="flex flex-col gap-2">
					<div className="hidden gap-2 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[110px_1fr_160px_110px_32px]">
						<span>Amount</span>
						<span>Description</span>
						<span>Category</span>
						<span>Type</span>
						<span />
					</div>
					{fields.map((rowField, index) => (
						<div
							key={rowField.id}
							onKeyDown={(event) => handleRowKeyDown(event, index)}
							className="grid grid-cols-2 items-start gap-2 rounded-md border border-border/60 p-2 sm:grid-cols-[110px_1fr_160px_110px_32px] sm:border-0 sm:p-0"
						>
							<FormField
								control={form.control}
								name={`rows.${index}.amount`}
								render={({ field }) => (
									<FormItem>
										<FormControl>
											<Input
												type="number"
												inputMode="decimal"
												step="0.01"
												min={0}
												placeholder="0.00"
												aria-label={`Row ${index + 1} amount`}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name={`rows.${index}.description`}
								render={({ field }) => (
									<FormItem>
										<FormControl>
											<Input
												type="text"
												placeholder="What was it for?"
												aria-label={`Row ${index + 1} description`}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name={`rows.${index}.categoryId`}
								render={({ field }) => (
									<FormItem>
										<Select
											value={field.value}
											onValueChange={field.onChange}
										>
											<FormControl>
												<SelectTrigger
													className="w-full"
													aria-label={`Row ${index + 1} category`}
												>
													<SelectValue placeholder="Category" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{selectableCategories.map((c) => (
													<SelectItem key={c.id} value={c.id}>
														{c.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name={`rows.${index}.type`}
								render={({ field }) => (
									<FormItem>
										<Select
											value={field.value}
											onValueChange={field.onChange}
										>
											<FormControl>
												<SelectTrigger
													className="w-full"
													aria-label={`Row ${index + 1} type`}
												>
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="need">Need</SelectItem>
												<SelectItem value="want">Want</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="text-muted-foreground hover:text-destructive"
								aria-label={`Remove row ${index + 1}`}
								disabled={fields.length === 1}
								onClick={() => remove(index)}
							>
								<Trash2 className="size-4" />
							</Button>
						</div>
					))}
				</div>

				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => append(emptyRow())}
				>
					<Plus className="size-4" />
					Add row
				</Button>

				<div className="flex justify-end gap-2 pt-2">
					<Button
						variant="outline"
						type="button"
						onClick={onCancel}
						disabled={isSubmitting}
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={handleSaveClick}
						disabled={isSubmitting}
					>
						{isSubmitting ? "Saving…" : "Save all"}
					</Button>
				</div>
			</form>
		</Form>
	);
}
```

- [ ] **Step 2: Verify types and lint**

Run: `pnpm check && pnpm test`
Expected: biome clean; tests PASS. (Component renders are verified manually in Task 5.)

- [ ] **Step 3: Commit**

```bash
git add src/features/expenses/presentation/BulkExpenseForm.tsx
git commit -m "feat(expenses): add bulk expense grid form"
```

---

### Task 5: `BulkExpenseModal` + page wiring + manual verification

**Files:**
- Create: `src/features/expenses/presentation/BulkExpenseModal.tsx`
- Modify: `src/features/expenses/presentation/ExpensePage.tsx`

**Interfaces:**
- Consumes: `BulkExpenseForm` (Task 4), `useBulkCreateExpenses` (Task 3), ShadCN `Dialog`, `lucide-react` `ListPlus`.
- Produces: `BulkExpenseModal` with props `{ categories: Category[]; onSubmit: (inputs: ExpenseCreateInput[]) => Promise<BulkCreateResult>; onClose: () => void; isSubmitting?: boolean }`. Phase 1 is user-complete after this task.

- [ ] **Step 1: Create the modal**

Create `src/features/expenses/presentation/BulkExpenseModal.tsx`:

```tsx
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import type { BulkCreateResult } from "../domain/services";
import type { Category, ExpenseCreateInput } from "../domain/types";
import { BulkExpenseForm } from "./BulkExpenseForm";

type BulkExpenseModalProps = {
	readonly categories: Category[];
	readonly onSubmit: (inputs: ExpenseCreateInput[]) => Promise<BulkCreateResult>;
	readonly onClose: () => void;
	readonly isSubmitting?: boolean;
};

export function BulkExpenseModal({
	categories,
	onSubmit,
	onClose,
	isSubmitting,
}: BulkExpenseModalProps) {
	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-3xl">
				<DialogTitle>Add multiple expenses</DialogTitle>
				<DialogDescription>
					Record several transactions for one day in a single pass.
				</DialogDescription>
				<BulkExpenseForm
					categories={categories}
					onSubmit={onSubmit}
					onCancel={onClose}
					isSubmitting={isSubmitting}
				/>
			</DialogContent>
		</Dialog>
	);
}
```

- [ ] **Step 2: Wire into `ExpensePage`**

In `src/features/expenses/presentation/ExpensePage.tsx`:

1. Extend the lucide import: `import { ListPlus, Plus } from "lucide-react";`
2. Add imports:

```ts
import { BulkExpenseModal } from "./BulkExpenseModal";
```

and add `useBulkCreateExpenses` to the `./useExpenses` import list, plus `BulkCreateResult` type:

```ts
import type { BulkCreateResult } from "../domain/services";
```

3. Add state + mutation next to the existing `modalState` (line ~54):

```ts
const [bulkOpen, setBulkOpen] = useState(false);
```

and next to `createMutation` (line ~81):

```ts
const bulkCreateMutation = useBulkCreateExpenses(trackerId);
```

4. Add the handler next to `handleFormSubmit`:

```ts
async function handleBulkSubmit(
	inputs: ExpenseCreateInput[],
): Promise<BulkCreateResult> {
	const result = await bulkCreateMutation.mutateAsync(inputs);
	// Only fully successful batches close the modal — failed rows stay in the
	// grid for retry.
	if (result.failed.length === 0) setBulkOpen(false);
	return result;
}
```

5. Replace the `PageHeader` `actions` prop with both buttons:

```tsx
actions={
	<div className="flex gap-2">
		<Button variant="outline" onClick={() => setBulkOpen(true)}>
			<ListPlus className="size-4" />
			Add multiple
		</Button>
		<Button onClick={openAddModal}>
			<Plus className="size-4" />
			Add expense
		</Button>
	</div>
}
```

6. Render the modal next to the existing `ExpenseModal` block (line ~229):

```tsx
{bulkOpen && (
	<BulkExpenseModal
		categories={categories}
		onSubmit={handleBulkSubmit}
		onClose={() => setBulkOpen(false)}
		isSubmitting={bulkCreateMutation.isPending}
	/>
)}
```

- [ ] **Step 3: Verify checks pass**

Run: `pnpm check && pnpm test`
Expected: clean, all tests PASS.

- [ ] **Step 4: Manual verification (dev server)**

Run: `pnpm dev`, sign in, open `/expenses`, then verify:

1. "Add multiple" opens the wide modal with today's date and 3 rows.
2. Fill 2 rows, leave row 3 untouched → Save all → both created (blank row silently dropped), modal closes, success toast "2 expenses added", table refreshes.
3. Validation: a row with amount `0` or empty description shows inline errors, nothing submits.
4. Enter in the last row's amount/description input appends a row.
5. Partial failure (e.g. stop the backend after opening the modal, or temporarily point one row at a bad category via devtools): failed rows stay with the banner, Save all again retries only those.

- [ ] **Step 5: Commit**

```bash
git add src/features/expenses/presentation/BulkExpenseModal.tsx src/features/expenses/presentation/ExpensePage.tsx
git commit -m "feat(expenses): add bulk expense modal and page wiring"
```

---

### Task 6: Parse types + dto mapping (Phase 2 starts)

**Files:**
- Modify: `src/features/expenses/domain/types.ts`
- Modify: `src/features/expenses/data/dto.ts`
- Test: `src/features/expenses/data/dto.test.ts` (create)

**Interfaces:**
- Consumes: existing `ExpenseType`, `Category` types.
- Produces:
  - domain: `ParsedExpense = { amount: number; description: string; categoryId?: string; type: ExpenseType; date: string }`, `ParseExpensesInput = { text: string; defaultDate: string; categories: Pick<Category, "id" | "name">[] }`
  - dto: `ParsedExpenseDto`, `ParseExpensesResponseDto`, `mapParsedExpense(dto): ParsedExpense`, `toParseExpensesBody(input): Record<string, unknown>`
  - Tasks 7–8 import these exact names.

- [ ] **Step 1: Add the domain types**

Append to `src/features/expenses/domain/types.ts`:

```ts
// AI smart paste: one parsed candidate row. categoryId is undefined when the
// model couldn't confidently map to an existing category — the review grid
// forces the user to pick one before saving.
export type ParsedExpense = {
	amount: number;
	description: string;
	categoryId?: string;
	type: ExpenseType;
	date: string;
};

export type ParseExpensesInput = {
	text: string;
	defaultDate: string;
	categories: Pick<Category, "id" | "name">[];
};
```

- [ ] **Step 2: Write the failing dto tests**

Create `src/features/expenses/data/dto.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { mapParsedExpense, toParseExpensesBody } from "./dto";

describe("mapParsedExpense", () => {
	it("converts decimal-string money to number and snake_case keys", () => {
		expect(
			mapParsedExpense({
				amount: "120.50",
				description: "coffee",
				category_id: "c1",
				type: "want",
				date: "2026-07-18",
			}),
		).toEqual({
			amount: 120.5,
			description: "coffee",
			categoryId: "c1",
			type: "want",
			date: "2026-07-18",
		});
	});

	it("maps a null category_id to undefined", () => {
		const parsed = mapParsedExpense({
			amount: "40",
			description: "bus",
			category_id: null,
			type: "need",
			date: "2026-07-18",
		});
		expect(parsed.categoryId).toBeUndefined();
	});
});

describe("toParseExpensesBody", () => {
	it("emits snake_case keys and trimmed category descriptors", () => {
		expect(
			toParseExpensesBody({
				text: "coffee 120, bus 40",
				defaultDate: "2026-07-18",
				categories: [{ id: "c1", name: "Food" }],
			}),
		).toEqual({
			text: "coffee 120, bus 40",
			default_date: "2026-07-18",
			categories: [{ id: "c1", name: "Food" }],
		});
	});
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test src/features/expenses/data/dto.test.ts`
Expected: FAIL — `mapParsedExpense` / `toParseExpensesBody` not exported.

- [ ] **Step 4: Implement the dto layer**

In `src/features/expenses/data/dto.ts`, add `ParsedExpense` and `ParseExpensesInput` to the type import from `../domain/types`, then append:

```ts
// AI smart-paste wire shapes (POST /ai/parse-expenses).

export type ParsedExpenseDto = {
	amount: string;
	description: string;
	category_id: string | null;
	type: Expense["type"];
	date: string;
};

export type ParseExpensesResponseDto = {
	expenses: ParsedExpenseDto[];
};

export function mapParsedExpense(dto: ParsedExpenseDto): ParsedExpense {
	return {
		amount: Number(dto.amount),
		description: dto.description,
		categoryId: dto.category_id ?? undefined,
		type: dto.type,
		date: dto.date,
	};
}

export function toParseExpensesBody(
	input: ParseExpensesInput,
): Record<string, unknown> {
	return {
		text: input.text,
		default_date: input.defaultDate,
		categories: input.categories.map(({ id, name }) => ({ id, name })),
	};
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test src/features/expenses/data/dto.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
pnpm check
git add src/features/expenses/domain/types.ts src/features/expenses/data/dto.ts src/features/expenses/data/dto.test.ts
git commit -m "feat(expenses): add smart-paste parse types and dto mapping"
```

---

### Task 7: `expenseParseRepository`

**Files:**
- Modify: `src/features/expenses/domain/repository.ts`
- Modify: `src/features/expenses/data/repository.ts`

**Interfaces:**
- Consumes: `ParsedExpense`, `ParseExpensesInput` (Task 6 domain), `ParseExpensesResponseDto`, `mapParsedExpense`, `toParseExpensesBody` (Task 6 dto), `apiFetch` (existing).
- Produces: interface `ExpenseParseRepository { parseText(input: ParseExpensesInput): Promise<ParsedExpense[]> }` and implementation `expenseParseRepository` exported from `data/repository.ts`. Task 8's hook calls `expenseParseRepository.parseText`.

- [ ] **Step 1: Extend the domain repository interface**

In `src/features/expenses/domain/repository.ts`, add `ParsedExpense` and `ParseExpensesInput` to the type import from `./types`, then append:

```ts
// AI smart paste. Not tracker-scoped: the endpoint receives the category list
// explicitly and returns candidate rows only — persistence still goes through
// ExpenseRepository.create after user review (never directly from the AI).
export interface ExpenseParseRepository {
	parseText(input: ParseExpensesInput): Promise<ParsedExpense[]>;
}
```

- [ ] **Step 2: Implement in the data repository**

In `src/features/expenses/data/repository.ts`:

1. Add `ExpenseParseRepository` to the import from `../domain/repository`.
2. Add `ParseExpensesResponseDto`, `mapParsedExpense`, `toParseExpensesBody` to the import from `./dto`.
3. Append:

```ts
export const expenseParseRepository: ExpenseParseRepository = {
	async parseText(input) {
		const dto = await apiFetch<ParseExpensesResponseDto>(
			"/ai/parse-expenses",
			{ method: "POST", body: toParseExpensesBody(input) },
		);
		return dto.expenses.map(mapParsedExpense);
	},
};
```

- [ ] **Step 3: Verify types and lint**

Run: `pnpm check && pnpm test`
Expected: clean, all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/features/expenses/domain/repository.ts src/features/expenses/data/repository.ts
git commit -m "feat(expenses): add expense parse repository seam"
```

---

### Task 8: Smart paste UI

**Files:**
- Create: `src/components/ui/textarea.tsx` (via shadcn CLI)
- Create: `src/features/expenses/presentation/SmartPasteSection.tsx`
- Modify: `src/features/expenses/presentation/useExpenses.ts`
- Modify: `src/features/expenses/presentation/BulkExpenseForm.tsx`

**Interfaces:**
- Consumes: `expenseParseRepository` (Task 7), `ParsedExpense`, `ParseExpensesInput` (Task 6), `isBlankBulkRow` + field array `replace` (Task 4), ShadCN `Textarea` (added here).
- Produces: `useParseExpenses()` mutation hook; `SmartPasteSection` with props `{ categories: Category[]; defaultDate: string; onParsed: (rows: ParsedExpense[]) => void }`; `BulkExpenseForm` gains the section at the top of the modal body.

- [ ] **Step 1: Add the Textarea component**

```bash
pnpm dlx shadcn@latest add textarea
```

Expected: creates `src/components/ui/textarea.tsx`.

- [ ] **Step 2: Add the `useParseExpenses` hook**

In `src/features/expenses/presentation/useExpenses.ts`, extend imports — add `expenseParseRepository` to the `../data/repository` import and `ParseExpensesInput` to the `../domain/types` type import — then append:

```ts
// Smart paste: turn free text into candidate rows. No cache to invalidate —
// results only pre-fill the bulk grid; saving still goes through
// useBulkCreateExpenses after the user reviews the rows.
export function useParseExpenses() {
	return useMutation({
		mutationFn: (input: ParseExpensesInput) =>
			expenseParseRepository.parseText(input),
		onError: () =>
			toast.error("Could not parse the text. Try again or add rows manually."),
	});
}
```

- [ ] **Step 3: Create `SmartPasteSection`**

Create `src/features/expenses/presentation/SmartPasteSection.tsx`:

```tsx
import { ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Category, ParsedExpense } from "../domain/types";
import { useParseExpenses } from "./useExpenses";

type SmartPasteSectionProps = {
	categories: Category[];
	defaultDate: string;
	onParsed: (rows: ParsedExpense[]) => void;
};

export function SmartPasteSection({
	categories,
	defaultDate,
	onParsed,
}: Readonly<SmartPasteSectionProps>) {
	const [open, setOpen] = useState(false);
	const [text, setText] = useState("");
	const parseMutation = useParseExpenses();

	async function handleParse() {
		try {
			const parsed = await parseMutation.mutateAsync({
				text,
				defaultDate,
				categories: categories.map(({ id, name }) => ({ id, name })),
			});
			onParsed(parsed);
			setText("");
		} catch {
			// Error toast comes from useParseExpenses; keep the text for retry.
		}
	}

	return (
		<div className="rounded-lg border border-border/60 bg-muted/30">
			<button
				type="button"
				className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium"
				onClick={() => setOpen((o) => !o)}
				aria-expanded={open}
			>
				{open ? (
					<ChevronDown className="size-4 text-muted-foreground" />
				) : (
					<ChevronRight className="size-4 text-muted-foreground" />
				)}
				<Sparkles className="size-4 text-primary" />
				Smart paste
				<span className="ml-1 font-normal text-muted-foreground">
					— paste text, get rows to review
				</span>
			</button>
			{open && (
				<div className="flex flex-col gap-2 border-t border-border/60 p-3">
					<Textarea
						value={text}
						onChange={(e) => setText(e.target.value)}
						placeholder={"coffee 120, bus 40, lunch 350 need\ngroceries 800"}
						rows={3}
						aria-label="Expenses text to parse"
					/>
					<div className="flex justify-end">
						<Button
							type="button"
							size="sm"
							onClick={handleParse}
							disabled={parseMutation.isPending || text.trim() === ""}
						>
							{parseMutation.isPending ? "Parsing…" : "Parse into rows"}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
```

- [ ] **Step 4: Mount it in `BulkExpenseForm`**

In `src/features/expenses/presentation/BulkExpenseForm.tsx`:

1. Add imports:

```ts
import type { ParsedExpense } from "../domain/types";
import { SmartPasteSection } from "./SmartPasteSection";
```

2. Add the handler inside the component (after `handleRowKeyDown`). Parsed rows replace blank starter rows and append after real ones; the batch date stays authoritative, so a parsed row's own `date` is ignored here:

```ts
function handleParsed(parsed: ParsedExpense[]) {
	const keep = form.getValues("rows").filter((row) => !isBlankBulkRow(row));
	replace([
		...keep,
		...parsed.map((p) => ({
			amount: String(p.amount),
			categoryId: p.categoryId ?? "",
			description: p.description,
			type: p.type,
		})),
	]);
}
```

3. Render the section between the date `FormField` and the failed-count banner:

```tsx
<SmartPasteSection
	categories={selectableCategories}
	defaultDate={form.watch("date")}
	onParsed={handleParsed}
/>
```

- [ ] **Step 5: Verify checks pass**

Run: `pnpm check && pnpm test`
Expected: clean, all tests PASS.

- [ ] **Step 6: Manual verification**

With `pnpm dev` (backend endpoint may not exist yet):

1. Bulk modal shows the collapsed "Smart paste" bar; expanding reveals textarea + Parse.
2. Parse with backend absent → error toast, pasted text preserved, grid untouched.
3. If `POST /ai/parse-expenses` is live: paste `coffee 120, bus 40, lunch 350 need` → rows appear pre-filled in the grid; a row with unmapped category shows an empty category select that blocks Save until picked.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/textarea.tsx src/features/expenses/presentation/SmartPasteSection.tsx src/features/expenses/presentation/useExpenses.ts src/features/expenses/presentation/BulkExpenseForm.tsx
git commit -m "feat(expenses): add AI smart paste section to bulk entry"
```

---

### Task 9: SPEC.md amendment + PR

**Files:**
- Modify: `SPEC.md` (via the `ck:spec` skill — sole mutator of SPEC.md; run this task in the main session, not a subagent)

**Interfaces:**
- Consumes: everything shipped in Tasks 1–8.
- Produces: updated SPEC §I/§V/§T; a PR to `main`.

- [ ] **Step 1: Amend SPEC.md via `ck:spec`**

Invoke the `ck:spec` skill with these amendments:

- §I add: `api: POST /ai/parse-expenses {text, default_date, categories[]} → {expenses[]} (candidate rows only, no persistence)`
- §V add: `V18: AI-parsed rows ! land in bulk review grid → user edits/saves via POST /expenses; ⊥ direct persistence from parse endpoint`
- §T add: `T19|x|bulk expense entry: BulkExpenseModal grid + parallel POST w/ per-row retry|V10,V18` and `T20|~|AI smart paste: FE seam + UI shipped; BE POST /ai/parse-expenses (Gemini Flash proxy) pending|V18`

- [ ] **Step 2: Full verification**

Run: `pnpm check && pnpm test && pnpm build`
Expected: all clean/green.

- [ ] **Step 3: Commit and open the PR**

```bash
git add SPEC.md
git commit -m "docs(spec): record bulk entry + smart paste endpoints and invariants"
git push -u origin feat/bulk-expense-entry
gh pr create --title "feat(expenses): bulk expense entry with AI smart paste" --body "$(cat <<'EOF'
## Summary
- Phase 1: "Add multiple" modal — shared date + row grid, parallel POSTs with per-row failure retry
- Phase 2: "Smart paste" — free text parsed to candidate rows via POST /ai/parse-expenses (backend proxy, pending), always reviewed in the grid before saving

## Test plan
- [ ] pnpm test (schema, partitionSettled, dto mapping)
- [ ] Manual: bulk add happy path, blank-row pruning, partial-failure retry
- [ ] Manual: smart paste with backend absent (graceful error) and present (rows pre-filled)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Backend contract (for the FastAPI repo — out of scope here)

`POST /ai/parse-expenses` (auth: Bearer, like all other endpoints)

Request:

```json
{
	"text": "coffee 120, bus 40, lunch 350 need",
	"default_date": "2026-07-18",
	"categories": [{ "id": "uuid", "name": "Food" }]
}
```

Response `200`:

```json
{
	"expenses": [
		{
			"amount": "120.00",
			"description": "coffee",
			"category_id": "uuid-or-null",
			"type": "want",
			"date": "2026-07-18"
		}
	]
}
```

Implementation notes: call Gemini Flash (free tier) with JSON-schema/structured output; prompt includes the category names so the model returns a matching `category_id` or `null`; `type` defaults to `need` unless the text says otherwise; amounts stay decimal strings per the app-wide money convention. Errors: `422` for empty/unparseable text, `502` for provider failures — the frontend treats any non-2xx as "could not parse".
