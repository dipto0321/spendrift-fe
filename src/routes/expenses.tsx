import { createFileRoute } from "@tanstack/react-router";

import { ExpensePage } from "@/features/expenses/presentation/ExpensePage";

export const Route = createFileRoute("/expenses")({
	component: ExpensePage,
});
