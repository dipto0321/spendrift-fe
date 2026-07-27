// Read the `sub` claim out of the access token so it can be used as the
// entropy source for the localStorage encryption key.
//
// The token is a standard three-part JWT (header.payload.signature). We
// base64url-decode the payload and read `sub` — Spendrift's auth service
// sets `sub` to the user's email. If `sub` is missing for any reason we
// fall back to the entire payload as a fingerprint so the derivation still
// produces a stable per-token key.

import { getAccessToken } from "@/shared/api/tokens";

type JwtPayload = {
	sub?: unknown;
	[key: string]: unknown;
};

function base64UrlDecode(input: string): string {
	// base64url → base64 by replacing URL-safe chars and padding.
	const padded = input.replace(/-/g, "+").replace(/_/g, "/");
	const padding =
		padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
	const decoded = globalThis.atob(padded + padding);
	// atob returns a binary string; treat it as UTF-8.
	try {
		return decodeURIComponent(escape(decoded));
	} catch {
		return decoded;
	}
}

/**
 * Best-effort extraction of the `sub` claim from a JWT. Returns the whole
 * payload string when the claim is missing or the token is malformed —
 * callers should treat the return value as "a stable per-user fingerprint"
 * rather than a specific identifier.
 */
export function getJwtSubject(jwt: string): string {
	if (!jwt) return "";
	const parts = jwt.split(".");
	if (parts.length < 2) return jwt;
	try {
		const payload = JSON.parse(base64UrlDecode(parts[1])) as JwtPayload;
		if (typeof payload.sub === "string" && payload.sub.length > 0) {
			return payload.sub;
		}
		return parts[1];
	} catch {
		return parts[1];
	}
}

/**
 * Convenience for the encryption path: get the entropy string for the
 * currently active session. Empty string means no session — encryption
 * refuses to run in that case (no key material).
 */
export function getActiveSessionEntropy(): string {
	const token = getAccessToken();
	if (!token) return "";
	return getJwtSubject(token);
}
