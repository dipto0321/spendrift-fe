import { z } from "zod";

// Numeric fields are held as strings in the form and parsed to numbers at
// submit; the schema's input and output types stay identical so it composes
// cleanly with the shadcn Form/Controller types.
export const budgetFormSchema = z
	.object({
		name: z.string().trim().min(1, "Name is required"),
		monthlyLimit: z
			.string()
			.min(1, "Monthly limit is required")
			.refine(
				(v) => !Number.isNaN(Number.parseFloat(v)),
				"Enter a valid amount",
			)
			.refine((v) => Number.parseFloat(v) > 0, "Must be greater than 0"),
		savingsTarget: z
			.string()
			.min(1, "Savings target is required")
			.refine(
				(v) => !Number.isNaN(Number.parseFloat(v)),
				"Enter a valid amount",
			)
			.refine((v) => Number.parseFloat(v) >= 0, "Cannot be negative"),
		month: z.string().min(1, "Month is required"),
	})
	.refine(
		(d) => {
			const limit = Number.parseFloat(d.monthlyLimit);
			const target = Number.parseFloat(d.savingsTarget);
			if (Number.isNaN(limit) || Number.isNaN(target)) return true;
			return target <= limit;
		},
		{
			message: "Savings target cannot exceed monthly limit",
			path: ["savingsTarget"],
		},
	);

export type BudgetFormValues = z.infer<typeof budgetFormSchema>;
