import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/features/auth/presentation/routeGuards";
import { SmartReport } from "@/features/reports/presentation/SmartReport";

export const Route = createFileRoute("/reports-ai")({
	beforeLoad: requireAuth,
	component: SmartReport,
});
