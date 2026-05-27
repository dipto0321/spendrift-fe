import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Budget, BudgetCreateInput } from "../domain/types";

type BudgetFormProps = {
	initialData?: Budget;
	onSubmit: (data: BudgetCreateInput) => void;
	onCancel: () => void;
	isSubmitting?: boolean;
};

export function BudgetForm({
	initialData,
	onSubmit,
	onCancel,
	isSubmitting,
}: BudgetFormProps) {
	const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

	const [name, setName] = useState(initialData?.name ?? "");
	const [monthlyLimit, setMonthlyLimit] = useState(
		initialData?.monthlyLimit?.toString() ?? "",
	);
	const [savingsTarget, setSavingsTarget] = useState(
		initialData?.savingsTarget?.toString() ?? "",
	);
	const [month, setMonth] = useState(initialData?.month ?? currentMonth);

	const [errors, setErrors] = useState<Record<string, string>>({});

	function validate(): boolean {
		const newErrors: Record<string, string> = {};

		if (!name.trim()) {
			newErrors.name = "Name is required";
		}

		const numLimit = Number.parseFloat(monthlyLimit);
		if (!monthlyLimit || Number.isNaN(numLimit)) {
			newErrors.monthlyLimit = "Monthly limit is required";
		} else if (numLimit <= 0) {
			newErrors.monthlyLimit = "Must be greater than 0";
		}

		const numTarget = Number.parseFloat(savingsTarget);
		if (!savingsTarget || Number.isNaN(numTarget)) {
			newErrors.savingsTarget = "Savings target is required";
		} else if (numTarget < 0) {
			newErrors.savingsTarget = "Cannot be negative";
		} else if (numTarget > numLimit) {
			newErrors.savingsTarget = "Savings target cannot exceed monthly limit";
		}

		if (!month) {
			newErrors.month = "Month is required";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	}

	function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!validate()) return;
		onSubmit({
			name: name.trim(),
			monthlyLimit: Number.parseFloat(monthlyLimit),
			savingsTarget: Number.parseFloat(savingsTarget),
			month,
		});
	}

	let submitLabel = "Create Budget";
	if (isSubmitting) {
		submitLabel = "Saving…";
	} else if (initialData) {
		submitLabel = "Update";
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-5">
			<div className="space-y-1.5">
				<Label htmlFor="budget-name">
					Name <span className="text-destructive">*</span>
				</Label>
				<Input
					id="budget-name"
					type="text"
					placeholder="e.g., May 2026 Budget"
					value={name}
					onChange={(e) => setName(e.target.value)}
					className={
						errors.name ? "aria-invalid:border-destructive" : undefined
					}
				/>
				{errors.name && (
					<p className="text-xs text-destructive">{errors.name}</p>
				)}
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-1.5">
					<Label htmlFor="monthly-limit">
						Monthly Limit <span className="text-destructive">*</span>
					</Label>
					<Input
						id="monthly-limit"
						type="number"
						inputMode="decimal"
						step="0.01"
						min={0}
						placeholder="0.00"
						value={monthlyLimit}
						onChange={(e) => setMonthlyLimit(e.target.value)}
						className={
							errors.monthlyLimit
								? "aria-invalid:border-destructive"
								: undefined
						}
					/>
					{errors.monthlyLimit && (
						<p className="text-xs text-destructive">{errors.monthlyLimit}</p>
					)}
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="savings-target">
						Savings Target <span className="text-destructive">*</span>
					</Label>
					<Input
						id="savings-target"
						type="number"
						inputMode="decimal"
						step="0.01"
						min={0}
						placeholder="0.00"
						value={savingsTarget}
						onChange={(e) => setSavingsTarget(e.target.value)}
						className={
							errors.savingsTarget
								? "aria-invalid:border-destructive"
								: undefined
						}
					/>
					{errors.savingsTarget && (
						<p className="text-xs text-destructive">{errors.savingsTarget}</p>
					)}
				</div>
			</div>

			<div className="space-y-1.5">
				<Label htmlFor="budget-month">
					Month <span className="text-destructive">*</span>
				</Label>
				<Input
					id="budget-month"
					type="month"
					value={month}
					onChange={(e) => setMonth(e.target.value)}
				/>
				{errors.month && (
					<p className="text-xs text-destructive">{errors.month}</p>
				)}
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
