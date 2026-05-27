import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/features/auth/presentation/routeGuards";
import BudgetPage from "@/features/budgets/presentation/BudgetPage";

export const Route = createFileRoute("/budget")({
	beforeLoad: requireAuth,
	component: BudgetPage,
});
