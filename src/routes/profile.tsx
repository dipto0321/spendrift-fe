import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/features/auth/presentation/ProfilePage";
import { requireAuth } from "@/features/auth/presentation/routeGuards";

export const Route = createFileRoute("/profile")({
	beforeLoad: requireAuth,
	component: ProfilePage,
});
