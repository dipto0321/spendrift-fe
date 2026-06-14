import { env } from "@/env";
import {
	clearTokens,
	getAccessToken,
	getRefreshToken,
	setTokens,
} from "./tokens";

const BASE_URL = env.VITE_API_BASE_URL;

// Normalized error thrown by every failed API call. `message` is safe to show
// in a toast; `fieldErrors` carries FastAPI 422 validation details keyed by
// field name when present.
export class ApiError extends Error {
	status: number;
	fieldErrors?: Record<string, string>;

	constructor(
		status: number,
		message: string,
		fieldErrors?: Record<string, string>,
	) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.fieldErrors = fieldErrors;
	}
}

type ApiFetchOptions = Omit<RequestInit, "body"> & {
	body?: unknown;
	// Skip the bearer header + refresh dance (used by the auth endpoints).
	skipAuth?: boolean;
};

// Called when a token refresh ultimately fails, so the auth layer can drop its
// session and the router can bounce to /sign-in. Registered by the auth repo.
let onAuthExpired: (() => void) | null = null;
export function setOnAuthExpired(handler: () => void): void {
	onAuthExpired = handler;
}

// Single-flight refresh so concurrent 401s trigger only one /auth/refresh call.
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
	const refreshToken = getRefreshToken();
	if (!refreshToken) return false;

	if (!refreshPromise) {
		refreshPromise = (async () => {
			try {
				const res = await fetch(`${BASE_URL}/auth/refresh`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ refresh_token: refreshToken }),
				});
				if (!res.ok) return false;
				const data = (await res.json()) as {
					access_token: string;
					refresh_token: string;
				};
				setTokens(data.access_token, data.refresh_token);
				return true;
			} catch {
				return false;
			} finally {
				refreshPromise = null;
			}
		})();
	}

	return refreshPromise;
}

function buildHeaders(options: ApiFetchOptions): Headers {
	const headers = new Headers(options.headers);
	if (options.body !== undefined && !headers.has("Content-Type")) {
		headers.set("Content-Type", "application/json");
	}
	if (!options.skipAuth) {
		const token = getAccessToken();
		if (token) headers.set("Authorization", `Bearer ${token}`);
	}
	return headers;
}

function rawFetch(path: string, options: ApiFetchOptions): Promise<Response> {
	const { body, skipAuth: _skipAuth, headers: _headers, ...init } = options;
	return fetch(`${BASE_URL}${path}`, {
		...init,
		headers: buildHeaders(options),
		body: body === undefined ? undefined : JSON.stringify(body),
	});
}

// Turn a FastAPI error body into a friendly message + optional field errors.
function parseErrorDetail(body: unknown): {
	message: string;
	fieldErrors?: Record<string, string>;
} {
	const detail = (body as { detail?: unknown } | null)?.detail;
	if (typeof detail === "string") {
		return { message: detail };
	}
	if (Array.isArray(detail)) {
		const fieldErrors: Record<string, string> = {};
		for (const item of detail as Array<{ loc?: unknown[]; msg?: string }>) {
			const field = item.loc?.[item.loc.length - 1];
			if (typeof field === "string" && item.msg) {
				fieldErrors[field] = item.msg;
			}
		}
		const first = Object.values(fieldErrors)[0];
		return { message: first ?? "Validation failed.", fieldErrors };
	}
	return { message: "Something went wrong. Please try again." };
}

async function toResult<T>(res: Response): Promise<T> {
	if (res.status === 204) return undefined as T;
	const text = await res.text();
	const body = text ? JSON.parse(text) : null;
	if (!res.ok) {
		const { message, fieldErrors } = parseErrorDetail(body);
		throw new ApiError(res.status, message, fieldErrors);
	}
	return body as T;
}

export async function apiFetch<T>(
	path: string,
	options: ApiFetchOptions = {},
): Promise<T> {
	let res = await rawFetch(path, options);

	// On an expired access token, refresh once and retry the original request.
	if (res.status === 401 && !options.skipAuth && getRefreshToken()) {
		const refreshed = await refreshAccessToken();
		if (refreshed) {
			res = await rawFetch(path, options);
		} else {
			clearTokens();
			onAuthExpired?.();
		}
	}

	return toResult<T>(res);
}
