// JWT token storage for the real API. Phase 1 keeps tokens in localStorage:
// simplest thing that works and matches the previous mock-auth pattern. The
// trade-off is they are not readable during SSR and are exposed to XSS; the API
// integration plan revisits an httpOnly-cookie strategy in the final phase.

const ACCESS_KEY = "spendrift.auth.access-token";
const REFRESH_KEY = "spendrift.auth.refresh-token";

function isBrowser() {
	return globalThis.window !== undefined;
}

export function getAccessToken(): string | null {
	if (!isBrowser()) return null;
	return globalThis.window.localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
	if (!isBrowser()) return null;
	return globalThis.window.localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
	if (!isBrowser()) return;
	globalThis.window.localStorage.setItem(ACCESS_KEY, accessToken);
	globalThis.window.localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens(): void {
	if (!isBrowser()) return;
	globalThis.window.localStorage.removeItem(ACCESS_KEY);
	globalThis.window.localStorage.removeItem(REFRESH_KEY);
}

export function hasAccessToken(): boolean {
	return getAccessToken() !== null;
}
