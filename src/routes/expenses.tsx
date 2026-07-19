import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/features/auth/presentation/routeGuards";
import { ExpensePage } from "@/features/expenses/presentation/ExpensePage";

type ExpensesSearch = {
	bulk?: 1;
};

export const Route = createFileRoute("/expenses")({
	beforeLoad: requireAuth,
	// `?bulk=1` opens the bulk-add modal once (used by the dashboard's
	// catch-up nudge); anything else normalizes to no search params.
	validateSearch: (search: Record<string, unknown>): ExpensesSearch =>
		search.bulk === 1 || search.bulk === "1" ? { bulk: 1 } : {},
	component: ExpensePage,
});
