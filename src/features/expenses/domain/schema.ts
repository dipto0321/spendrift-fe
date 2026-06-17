import { z } from "zod";

// The amount input holds a string; validate it here and parse to a number at
// submit time (keeping the schema's input and output types identical so it
// composes cleanly with the shadcn Form/Controller types).
export const expenseFormSchema = z.object({
	amount: z
		.string()
		.min(1, "Amount is required")
		.refine((v) => !Number.isNaN(Number.parseFloat(v)), "Enter a valid amount")
		.refine((v) => Number.parseFloat(v) > 0, "Amount must be greater than 0"),
	categoryId: z.string().min(1, "Category is required"),
	date: z.string().min(1, "Date is required"),
	description: z.string().trim().min(1, "Description is required"),
	type: z.enum(["need", "want"]),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
