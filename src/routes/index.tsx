import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/features/auth/presentation/routeGuards";
import { DashboardPage } from "@/features/dashboard/components/DashboardPage";

export const Route = createFileRoute("/")({
	beforeLoad: requireAuth,
	component: DashboardPage,
});
