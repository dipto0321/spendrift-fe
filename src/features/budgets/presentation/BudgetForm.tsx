import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { type BudgetFormValues, budgetFormSchema } from "../domain/schema";
import type { Budget, BudgetCreateInput } from "../domain/types";

type BudgetFormProps = {
	initialData?: Budget;
	onSubmit: (data: BudgetCreateInput) => void;
	onCancel: () => void;
	isSubmitting?: boolean;
};

const requiredMark = <span className="text-destructive">*</span>;

function getCurrentMonth() {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function BudgetForm({
	initialData,
	onSubmit,
	onCancel,
	isSubmitting,
}: Readonly<BudgetFormProps>) {
	const form = useForm<BudgetFormValues>({
		resolver: zodResolver(budgetFormSchema),
		defaultValues: {
			name: initialData?.name ?? "",
			monthlyLimit: initialData?.monthlyLimit?.toString() ?? "",
			savingsTarget: initialData?.savingsTarget?.toString() ?? "",
			// Budgets are always for the current month (the picker was removed).
			month: getCurrentMonth(),
		},
	});

	let submitLabel = "Create Budget";
	if (isSubmitting) {
		submitLabel = "Saving…";
	} else if (initialData) {
		submitLabel = "Update";
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit((values) =>
					onSubmit({
						...values,
						monthlyLimit: Number.parseFloat(values.monthlyLimit),
						savingsTarget: Number.parseFloat(values.savingsTarget),
					}),
				)}
				className="space-y-5"
			>
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Name {requiredMark}</FormLabel>
							<FormControl>
								<Input
									type="text"
									placeholder="e.g., May 2026 Budget"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="grid grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="monthlyLimit"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Monthly Limit {requiredMark}</FormLabel>
								<FormControl>
									<Input
										type="number"
										inputMode="decimal"
										step="0.01"
										min={0}
										placeholder="0.00"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="savingsTarget"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Savings Target {requiredMark}</FormLabel>
								<FormControl>
									<Input
										type="number"
										inputMode="decimal"
										step="0.01"
										min={0}
										placeholder="0.00"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
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
		</Form>
	);
}
