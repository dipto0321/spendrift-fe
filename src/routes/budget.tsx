import { createFileRoute } from "@tanstack/react-router";
import BudgetPage from "@/features/budgets/presentation/BudgetPage";

export const Route = createFileRoute("/budget")({
	component: BudgetPage,
});
