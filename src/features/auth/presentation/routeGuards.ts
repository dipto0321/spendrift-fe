import { redirect } from "@tanstack/react-router";
import { authRepository } from "../data/repository";

function isBrowser() {
	return globalThis.window !== undefined;
}

export function requireAuth() {
	if (!isBrowser()) {
		return;
	}

	const snapshot = authRepository.getSnapshot();
	if (!snapshot.isAuthenticated) {
		throw redirect({ to: snapshot.hasAccount ? "/sign-in" : "/sign-up" });
	}
}

export function redirectIfAuthed() {
	if (!isBrowser()) {
		return;
	}

	if (authRepository.getSnapshot().isAuthenticated) {
		throw redirect({ to: "/" });
	}
}
