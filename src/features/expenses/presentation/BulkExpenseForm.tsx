import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { type KeyboardEvent, useState } from "react";
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
import type { Category, ExpenseCreateInput, ParsedExpense } from "../domain/types";
import { SmartPasteSection } from "./SmartPasteSection";

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
		event: KeyboardEvent<HTMLDivElement>,
		index: number,
	) {
		if (event.key !== "Enter") return;
		if (!(event.target instanceof HTMLInputElement)) return;
		event.preventDefault();
		if (index === fields.length - 1) append(emptyRow());
	}

	// Parsed rows replace blank starter rows and append after real ones; the
	// batch date stays authoritative, so a parsed row's own `date` is ignored here.
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

	return (
		<Form {...form}>
			<form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
				<fieldset disabled={isSubmitting} className="space-y-4">
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

					<SmartPasteSection
						categories={selectableCategories}
						defaultDate={form.watch("date")}
						onParsed={handleParsed}
					/>

					{failedCount > 0 && (
						<p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
							{failedCount} {failedCount === 1 ? "expense" : "expenses"} failed
							to save. The rows below were kept — fix or remove them, then save
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
							// biome-ignore lint/a11y/noStaticElementInteractions: event delegation for Enter key handling
							<div
								key={rowField.id}
								tabIndex={-1}
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
				</fieldset>

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
