import { redirect } from "@tanstack/react-router";
import { authRepository } from "../data/repository";

function isBrowser() {
	return globalThis.window !== undefined;
}

export function requireAuth() {
	if (!isBrowser()) {
		return;
	}

	if (!authRepository.getSnapshot().isAuthenticated) {
		// Always land on sign-in; new users can switch to sign-up from there.
		throw redirect({ to: "/sign-in" });
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
