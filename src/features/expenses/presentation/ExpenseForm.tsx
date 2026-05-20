import { useState } from "react";
import type { Category, CategoryColor, Expense, ExpenseCreateInput, ExpenseType } from "../domain/types";
import { CategoryColorPicker } from "./CategoryColorPicker";

type ExpenseFormProps = {
	categories: Category[];
	initialData?: Expense;
	onSubmit: (data: ExpenseCreateInput) => void;
	onCancel: () => void;
	isSubmitting?: boolean;
};

export function ExpenseForm({
	categories,
	initialData,
	onSubmit,
	onCancel,
	isSubmitting,
}: ExpenseFormProps) {
	const [amount, setAmount] = useState(initialData?.amount?.toString() ?? "");
	const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? "");
	const [date, setDate] = useState(initialData?.date ?? new Date().toISOString().split("T")[0]);
	const [description, setDescription] = useState(initialData?.description ?? "");
	const [type, setType] = useState<ExpenseType>(initialData?.type ?? "need");
	const [showNewCategory, setShowNewCategory] = useState(false);
	const [newCategoryName, setNewCategoryName] = useState("");
	const [newCategoryColor, setNewCategoryColor] = useState<CategoryColor>("#3B82F6");

	const [errors, setErrors] = useState<Record<string, string>>({});

	function validate(): boolean {
		const newErrors: Record<string, string> = {};
		const numAmount = parseFloat(amount);
		if (!amount || Number.isNaN(numAmount)) {
			newErrors.amount = "Amount is required";
		} else if (numAmount <= 0) {
			newErrors.amount = "Amount must be positive";
		}
		if (!categoryId) {
			newErrors.categoryId = "Category is required";
		}
		if (!date) {
			newErrors.date = "Date is required";
		}
		if (!type) {
			newErrors.type = "Type is required";
		}
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!validate()) return;
		onSubmit({
			amount: parseFloat(amount),
			categoryId,
			date,
			description: description || undefined,
			type,
		});
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-5">
			<div className="space-y-1.5">
				<label htmlFor="amount" className="text-sm font-medium text-foreground">
					Amount <span className="text-destructive">*</span>
				</label>
				<input
					id="amount"
					type="number"
					inputMode="decimal"
					step="0.01"
					min="0"
					placeholder="0.00"
					value={amount}
					onChange={(e) => setAmount(e.target.value)}
					className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
						errors.amount ? "border-destructive" : "border-input"
					}`}
				/>
				{errors.amount && (
					<p className="text-xs text-destructive">{errors.amount}</p>
				)}
			</div>

			<div className="space-y-1.5">
				<label htmlFor="category" className="text-sm font-medium text-foreground">
					Category <span className="text-destructive">*</span>
				</label>
				<select
					id="category"
					value={categoryId}
					onChange={(e) => setCategoryId(e.target.value)}
					className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
						errors.categoryId ? "border-destructive" : "border-input"
					}`}
				>
					<option value="">Select a category</option>
					{categories
						.filter((c) => c.id !== "uncategorized" || initialData?.categoryId === "uncategorized")
						.map((c) => (
							<option key={c.id} value={c.id}>
								{c.name}
							</option>
						))}
				</select>
				{errors.categoryId && (
					<p className="text-xs text-destructive">{errors.categoryId}</p>
				)}
				<button
					type="button"
					onClick={() => setShowNewCategory(!showNewCategory)}
					className="text-xs text-primary hover:underline"
				>
					{showNewCategory ? "Cancel new category" : "+ Create new category"}
				</button>

				{showNewCategory && (
					<div className="mt-2 space-y-2 rounded-lg border border-border/50 bg-muted/20 p-3">
						<input
							type="text"
							placeholder="Category name"
							value={newCategoryName}
							onChange={(e) => setNewCategoryName(e.target.value)}
							className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
						/>
						<CategoryColorPicker
							value={newCategoryColor}
							onChange={setNewCategoryColor}
						/>
						<button
							type="button"
							onClick={() => {
								if (newCategoryName.trim()) {
									onSubmit({
										amount: 0,
										categoryId: "new",
										date: new Date().toISOString().split("T")[0],
										type: "need",
										description: JSON.stringify({
											action: "createCategory",
											name: newCategoryName.trim(),
											color: newCategoryColor,
										}),
									});
								}
							}}
							disabled={!newCategoryName.trim()}
							className="w-full rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
						>
							Add Category
						</button>
					</div>
				)}
			</div>

			<div className="space-y-1.5">
				<label htmlFor="date" className="text-sm font-medium text-foreground">
					Date <span className="text-destructive">*</span>
				</label>
				<input
					id="date"
					type="date"
					value={date}
					onChange={(e) => setDate(e.target.value)}
					className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
						errors.date ? "border-destructive" : "border-input"
					}`}
				/>
				{errors.date && (
					<p className="text-xs text-destructive">{errors.date}</p>
				)}
			</div>

			<div className="space-y-1.5">
				<label htmlFor="description" className="text-sm font-medium text-foreground">
					Description
				</label>
				<input
					id="description"
					type="text"
					placeholder="What was this expense for?"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
				/>
			</div>

			<div className="space-y-1.5">
				<span className="text-sm font-medium text-foreground">
					Type <span className="text-destructive">*</span>
				</span>
				<div className="flex gap-2">
					<button
						type="button"
						onClick={() => setType("need")}
						className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-all ${
							type === "need"
								? "border-green-500/50 bg-green-500/15 text-green-600 dark:text-green-400"
								: "border-input bg-background text-muted-foreground hover:bg-muted/50"
						}`}
					>
						Need
					</button>
					<button
						type="button"
						onClick={() => setType("want")}
						className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-all ${
							type === "want"
								? "border-orange-500/50 bg-orange-500/15 text-orange-600 dark:text-orange-400"
								: "border-input bg-background text-muted-foreground hover:bg-muted/50"
						}`}
					>
						Want
					</button>
				</div>
				{errors.type && (
					<p className="text-xs text-destructive">{errors.type}</p>
				)}
			</div>

			<div className="flex justify-end gap-2 pt-2">
				<button
					type="button"
					onClick={onCancel}
					disabled={isSubmitting}
					className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/50 disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={isSubmitting}
					className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
				>
					{isSubmitting ? "Saving…" : initialData ? "Update" : "Add Expense"}
				</button>
			</div>
		</form>
	);
}