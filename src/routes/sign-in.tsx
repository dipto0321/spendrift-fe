import { createFileRoute } from "@tanstack/react-router";
import { redirectIfAuthed } from "@/features/auth/presentation/routeGuards";
import { SignInPage } from "@/features/auth/presentation/SignInPage";

export const Route = createFileRoute("/sign-in")({
	beforeLoad: redirectIfAuthed,
	component: SignInPage,
});
