import { useSyncExternalStore } from "react";
import { ApiError, apiFetch, setOnAuthExpired } from "@/shared/api/client";
import {
	clearTokens,
	getRefreshToken,
	hasAccessToken,
	setTokens,
} from "@/shared/api/tokens";
import type {
	AuthUser,
	SignInInput,
	SignUpInput,
	UpdatePasswordInput,
	UpdateProfileInput,
} from "../domain/types";
import { mapUser, type TokenResponseDto, type UserResponseDto } from "./dto";

type AuthSnapshot = {
	user: AuthUser | null;
	hasAccount: boolean;
	isAuthenticated: boolean;
};

const listeners = new Set<() => void>();
let cachedUser: AuthUser | null = null;
// Tracks the in-flight bootstrap so we don't fetch /users/me repeatedly.
let bootstrapPromise: Promise<void> | null = null;

function computeSnapshot(): AuthSnapshot {
	const authed = hasAccessToken();
	return {
		user: cachedUser,
		// With token-based auth there is no separate "an account exists" signal;
		// it only matters whether the current session is authenticated.
		hasAccount: authed,
		isAuthenticated: authed,
	};
}

let snapshotCache: AuthSnapshot = computeSnapshot();

function notify() {
	snapshotCache = computeSnapshot();
	for (const listener of listeners) {
		listener();
	}
}

// When a token refresh fails for good, drop the session so the gate redirects.
setOnAuthExpired(() => {
	cachedUser = null;
	notify();
});

async function fetchCurrentUser(): Promise<AuthUser> {
	const dto = await apiFetch<UserResponseDto>("/users/me");
	return mapUser(dto);
}

export const authRepository = {
	getSnapshot(): AuthSnapshot {
		return snapshotCache;
	},

	subscribe(listener: () => void) {
		listeners.add(listener);
		return () => listeners.delete(listener);
	},

	async signIn(input: SignInInput): Promise<AuthUser> {
		const tokens = await apiFetch<TokenResponseDto>("/auth/login", {
			method: "POST",
			skipAuth: true,
			body: { email: input.email, password: input.password },
		});
		setTokens(tokens.access_token, tokens.refresh_token);
		cachedUser = await fetchCurrentUser();
		notify();
		return cachedUser;
	},

	async signUp(input: SignUpInput): Promise<AuthUser> {
		const tokens = await apiFetch<TokenResponseDto>("/auth/register", {
			method: "POST",
			skipAuth: true,
			body: { name: input.name, email: input.email, password: input.password },
		});
		setTokens(tokens.access_token, tokens.refresh_token);
		cachedUser = await fetchCurrentUser();
		notify();
		return cachedUser;
	},

	async signOut(): Promise<void> {
		const refreshToken = getRefreshToken();
		try {
			if (refreshToken) {
				await apiFetch<void>("/auth/sign-out", {
					method: "POST",
					body: { refresh_token: refreshToken },
				});
			}
		} catch {
			// Best-effort: even if the server call fails, drop the local session.
		}
		clearTokens();
		cachedUser = null;
		notify();
	},

	// Load the current user once on app start if a token is present. Resolves the
	// session against the server; on failure the client clears tokens via the
	// onAuthExpired handler.
	async bootstrap(): Promise<void> {
		if (!hasAccessToken() || cachedUser) return;
		bootstrapPromise ??= (async () => {
			try {
				cachedUser = await fetchCurrentUser();
				notify();
			} catch {
				// 401s are handled inside apiFetch (refresh + onAuthExpired).
			} finally {
				bootstrapPromise = null;
			}
		})();
		return bootstrapPromise;
	},

	// The API does not yet expose profile/password/avatar updates.
	async updateProfile(_input: UpdateProfileInput): Promise<AuthUser> {
		throw new ApiError(501, "Editing your profile isn't available yet.");
	},

	async updatePassword(_input: UpdatePasswordInput): Promise<AuthUser> {
		throw new ApiError(501, "Changing your password isn't available yet.");
	},

	async updateAvatar(_dataUrl: string | null): Promise<AuthUser> {
		throw new ApiError(501, "Updating your avatar isn't available yet.");
	},
};

export function useAuthSnapshot() {
	return useSyncExternalStore(
		authRepository.subscribe,
		authRepository.getSnapshot,
		authRepository.getSnapshot,
	);
}
