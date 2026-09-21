import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/features/auth/presentation/routeGuards";
import TaxPage from "@/features/tax/presentation/TaxPage";

export const Route = createFileRoute("/tax")({
	beforeLoad: requireAuth,
	component: TaxPage,
});
