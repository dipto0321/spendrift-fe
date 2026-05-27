import { createFileRoute } from "@tanstack/react-router";
import { redirectIfAuthed } from "@/features/auth/presentation/routeGuards";
import { SignUpPage } from "@/features/auth/presentation/SignUpPage";

export const Route = createFileRoute("/sign-up")({
	beforeLoad: redirectIfAuthed,
	component: SignUpPage,
});
