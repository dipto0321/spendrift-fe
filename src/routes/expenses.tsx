import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/features/auth/presentation/routeGuards";
import { ExpensePage } from "@/features/expenses/presentation/ExpensePage";

export const Route = createFileRoute("/expenses")({
	beforeLoad: requireAuth,
	component: ExpensePage,
});
