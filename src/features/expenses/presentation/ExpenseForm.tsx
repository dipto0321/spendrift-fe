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
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/shared/ui/DatePicker";
import { type ExpenseFormValues, expenseFormSchema } from "../domain/schema";
import type { Category, Expense, ExpenseCreateInput } from "../domain/types";

type ExpenseFormProps = {
	categories: Category[];
	initialData?: Expense;
	onSubmit: (data: ExpenseCreateInput) => void;
	onCancel: () => void;
	isSubmitting?: boolean;
};

const requiredMark = <span className="text-destructive">*</span>;

const typeOptions = [
	{
		value: "need",
		label: "Need",
		activeBorder: "border-green-500 bg-card",
		activeDot: "bg-green-500 ring-2 ring-green-400",
		activeText: "text-green-400",
	},
	{
		value: "want",
		label: "Want",
		activeBorder: "border-primary/30 bg-card",
		activeDot: "bg-primary/60 ring-2 ring-primary/40",
		activeText: "text-primary/60",
	},
] as const;

export function ExpenseForm({
	categories,
	initialData,
	onSubmit,
	onCancel,
	isSubmitting,
}: Readonly<ExpenseFormProps>) {
	const form = useForm<ExpenseFormValues>({
		resolver: zodResolver(expenseFormSchema),
		defaultValues: {
			amount: initialData?.amount?.toString() ?? "",
			categoryId: initialData?.categoryId ?? "",
			date: initialData?.date ?? new Date().toISOString().split("T")[0],
			description: initialData?.description ?? "",
			type: initialData?.type ?? "need",
		},
	});

	let submitLabel = "Add Expense";
	if (isSubmitting) {
		submitLabel = "Saving…";
	} else if (initialData) {
		submitLabel = "Update";
	}

	const selectableCategories = categories.filter(
		(c) => c.name !== "Uncategorized" || initialData?.categoryId === c.id,
	);

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit((values) =>
					onSubmit({
						...values,
						amount: Number.parseFloat(values.amount),
					}),
				)}
				className="space-y-5"
			>
				<FormField
					control={form.control}
					name="amount"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Amount {requiredMark}</FormLabel>
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
					name="categoryId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Category {requiredMark}</FormLabel>
							<Select value={field.value} onValueChange={field.onChange}>
								<FormControl>
									<SelectTrigger className="w-full" size="default">
										<SelectValue placeholder="Select a category" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectGroup>
										<SelectLabel>Categories</SelectLabel>
										{selectableCategories.map((c) => (
											<SelectItem key={c.id} value={c.id}>
												{c.name}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="date"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Date {requiredMark}</FormLabel>
							<FormControl>
								<DatePicker value={field.value} onChange={field.onChange} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Description {requiredMark}</FormLabel>
							<FormControl>
								<Input
									type="text"
									placeholder="What was this expense for?"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="type"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Type {requiredMark}</FormLabel>
							<FormControl>
								<div
									role="radiogroup"
									aria-label="Expense type"
									className="flex gap-4"
								>
									{typeOptions.map((option) => {
										const selected = field.value === option.value;
										return (
											<label
												key={option.value}
												className={`relative flex flex-1 cursor-pointer items-center justify-center rounded-lg border p-2.5 text-base font-medium transition-all focus-within:ring-2 focus-within:ring-primary/50 ${
													selected
														? option.activeBorder
														: "border-border bg-card/0 text-muted-foreground hover:border-muted-foreground/50"
												}`}
											>
												<input
													type="radio"
													name="expense-type"
													value={option.value}
													checked={selected}
													onChange={() => field.onChange(option.value)}
													className="sr-only"
												/>
												<span
													className={`absolute left-3 top-3 h-2.5 w-2.5 rounded-full ${
														selected
															? option.activeDot
															: "border bg-transparent"
													}`}
												/>
												<span
													className={
														selected
															? option.activeText
															: "text-muted-foreground"
													}
												>
													{option.label}
												</span>
											</label>
										);
									})}
								</div>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

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
