import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
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
	month: string;
	currency: string;
	onSubmit: (data: BudgetCreateInput) => void;
	isSubmitting?: boolean;
	readOnly?: boolean;
};

export function BudgetForm({
	initialData,
	month,
	currency,
	onSubmit,
	isSubmitting,
	readOnly = false,
}: Readonly<BudgetFormProps>) {
	// Start in edit/create mode when no budget exists yet; view mode otherwise
	const [isEditing, setIsEditing] = useState(!initialData);

	const form = useForm<BudgetFormValues>({
		resolver: zodResolver(budgetFormSchema),
		defaultValues: {
			name: "",
			monthlyLimit: initialData?.monthlyLimit?.toString() ?? "",
			savingsTarget: initialData?.savingsTarget?.toString() ?? "",
			month,
		},
	});

	// Reset form and editing state whenever the budget or month changes
	// (covers month switching and post-save refetch)
	useEffect(() => {
		const monthLabel = new Date(`${month}-01`).toLocaleDateString("en", {
			month: "long",
			year: "numeric",
		});
		form.reset({
			name: initialData?.name ?? monthLabel,
			monthlyLimit: initialData?.monthlyLimit?.toString() ?? "",
			savingsTarget: initialData?.savingsTarget?.toString() ?? "",
			month,
		});
		setIsEditing(!initialData);
	}, [initialData, month, form]);

	const isDisabled = readOnly || !isEditing;
	const isDirty = form.formState.isDirty;

	return (
		<Form {...form}>
			{readOnly ? (
				<div className="mb-5 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
					<Lock className="size-4 shrink-0" />
					<span>
						Budget editing is disabled for past months. Switch to the current
						month to make changes.
					</span>
				</div>
			) : null}

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
					name="monthlyLimit"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Monthly budget ({currency})</FormLabel>
							<FormControl>
								<Input
									type="number"
									inputMode="decimal"
									step="0.01"
									min={0}
									placeholder="0"
									disabled={isDisabled}
									{...field}
								/>
							</FormControl>
							<FormDescription>
								Total you plan to spend across all categories.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="savingsTarget"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Savings target ({currency})</FormLabel>
							<FormControl>
								<Input
									type="number"
									inputMode="decimal"
									step="0.01"
									min={0}
									placeholder="0"
									disabled={isDisabled}
									{...field}
								/>
							</FormControl>
							<FormDescription>
								How much you aim to set aside each month.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				{readOnly ? null : (
					<div className="flex gap-2 pt-1">
						{isEditing ? (
							<>
								<Button
									type="button"
									variant="outline"
									className="flex-1"
									disabled={isSubmitting}
									onClick={() => {
										form.reset();
										setIsEditing(false);
									}}
								>
									Cancel
								</Button>
								<Button
									type="submit"
									className="flex-1"
									disabled={isSubmitting || !isDirty}
								>
									{isSubmitting ? "Saving…" : "Save budget"}
								</Button>
							</>
						) : (
							<Button
								type="button"
								variant="outline"
								className="w-full"
								onClick={() => setIsEditing(true)}
							>
								Edit budget
							</Button>
						)}
					</div>
				)}
			</form>
		</Form>
	);
}
