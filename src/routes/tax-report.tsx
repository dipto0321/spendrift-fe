import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/features/auth/presentation/routeGuards";
import TaxReportPage from "@/features/tax-report/presentation/TaxReportPage";

export const Route = createFileRoute("/tax-report")({
	beforeLoad: requireAuth,
	component: TaxReportPage,
});
