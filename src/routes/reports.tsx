import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/features/auth/presentation/routeGuards";
import ReportsPage from "@/features/reports/presentation/ReportsPage";

export const Route = createFileRoute("/reports")({
	beforeLoad: requireAuth,
	component: ReportsPage,
});
