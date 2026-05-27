import { redirect } from "@tanstack/react-router";
import { authRepository } from "../data/repository";

export function requireAuth() {
	const snapshot = authRepository.getSnapshot();
	if (!snapshot.isAuthenticated) {
		throw redirect({ to: snapshot.hasAccount ? "/sign-in" : "/sign-up" });
	}
}

export function redirectIfAuthed() {
	if (authRepository.getSnapshot().isAuthenticated) {
		throw redirect({ to: "/" });
	}
}
