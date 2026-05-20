import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import type {
	Category,
	Expense,
	ExpenseCreateInput,
	ExpenseType,
} from "../domain/types";

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
}: Readonly<ExpenseFormProps>) {
	const [amount, setAmount] = useState(initialData?.amount?.toString() ?? "");
	const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? "");
	const [date, setDate] = useState(
		initialData?.date ?? new Date().toISOString().split("T")[0],
	);
	const [description, setDescription] = useState(
		initialData?.description ?? "",
	);
	const [type, setType] = useState<ExpenseType>(initialData?.type ?? "need");

	const [errors, setErrors] = useState<Record<string, string>>({});

	function validate(): boolean {
		const newErrors: Record<string, string> = {};

		const numAmount = Number.parseFloat(amount);
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
		if (!description) {
			newErrors.description = "Description is required";
		}
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	}

	function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!validate()) return;
		onSubmit({
			amount: Number.parseFloat(amount),
			categoryId,
			date,
			description,
			type,
		});
	}

	let submitLabel = "Add Expense";
	if (isSubmitting) {
		submitLabel = "Saving…";
	} else if (initialData) {
		submitLabel = "Update";
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-5">
			<div className="space-y-1.5">
				<Label htmlFor="amount">
					Amount <span className="text-destructive">*</span>
				</Label>
				<Input
					id="amount"
					type="number"
					inputMode="decimal"
					step="0.01"
					min={0}
					placeholder="0.00"
					value={amount}
					onChange={(e) => setAmount(e.target.value)}
					className={
						errors.amount ? "aria-invalid:border-destructive" : undefined
					}
				/>
				{errors.amount && (
					<p className="text-xs text-destructive">{errors.amount}</p>
				)}
			</div>

			<div className="space-y-1.5">
				<Label htmlFor="category">
					Category <span className="text-destructive">*</span>
				</Label>
				<Select value={categoryId} onValueChange={(v) => setCategoryId(v)}>
					<SelectTrigger className="w-full" size="default">
						<SelectValue placeholder="Select a category" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectLabel>Categories</SelectLabel>
							{categories
								.filter(
									(c) =>
										c.id !== "uncategorized" ||
										initialData?.categoryId === "uncategorized",
								)
								.map((c) => (
									<SelectItem key={c.id} value={c.id}>
										{c.name}
									</SelectItem>
								))}
						</SelectGroup>
					</SelectContent>
				</Select>
				{errors.categoryId && (
					<p className="text-xs text-destructive">{errors.categoryId}</p>
				)}
			</div>

			<div className="space-y-1.5">
				<Label htmlFor="date">
					Date <span className="text-destructive">*</span>
				</Label>
				<Input
					id="date"
					type="date"
					value={date}
					onChange={(e) => setDate(e.target.value)}
				/>
				{errors.date && (
					<p className="text-xs text-destructive">{errors.date}</p>
				)}
			</div>

			<div className="space-y-1.5">
				<Label htmlFor="description">
					Description <span className="text-destructive">*</span>
				</Label>
				<Input
					id="description"
					type="text"
					placeholder="What was this expense for?"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					className={
						errors.description ? "aria-invalid:border-destructive" : undefined
					}
				/>
				{errors.description && (
					<p className="text-xs text-destructive">{errors.description}</p>
				)}
			</div>

			<div className="space-y-1.5">
				<Label>
					Type <span className="text-destructive">*</span>
				</Label>
				<div role="radiogroup" aria-label="Expense type" className="flex gap-4">
					<Label
						className={`relative flex-1 cursor-pointer rounded-lg border p-2.5 text-base font-medium transition-all flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
							type === "need"
								? "border-green-500 bg-card"
								: "border-border bg-card/0 text-muted-foreground hover:border-muted-foreground/50"
						}`}
					>
						<input
							type="radio"
							name="expense-type"
							value="need"
							checked={type === "need"}
							onChange={() => setType("need")}
							className="sr-only"
						/>
						<span
							className={`absolute left-3 top-3 h-2.5 w-2.5 rounded-full ${type === "need" ? "bg-green-500 ring-2 ring-green-400" : "border bg-transparent"}`}
						/>
						<span
							className={`${type === "need" ? "text-green-400" : "text-muted-foreground"}`}
						>
							Need
						</span>
					</Label>

					<Label
						className={`relative flex-1 cursor-pointer rounded-lg border p-2.5 text-base font-medium transition-all flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
							type === "want"
								? "border-primary/30 bg-card"
								: "border-border bg-card/0 text-muted-foreground hover:border-muted-foreground/50"
						}`}
					>
						<input
							type="radio"
							name="expense-type"
							value="want"
							checked={type === "want"}
							onChange={() => setType("want")}
							className="sr-only"
						/>
						<span
							className={`absolute left-3 top-3 h-2.5 w-2.5 rounded-full ${type === "want" ? "bg-primary/60 ring-2 ring-primary/40" : "border bg-transparent"}`}
						/>
						<span
							className={`${type === "want" ? "text-primary/60" : "text-muted-foreground"}`}
						>
							Want
						</span>
					</Label>
				</div>
			</div>

			<div className="flex justify-end gap-2 pt-2">
				<Button
					variant="outline"
					type="button"
					onClick={onCancel}
					disabled={isSubmitting}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={isSubmitting}>
					{submitLabel}
				</Button>
			</div>
		</form>
	);
}
