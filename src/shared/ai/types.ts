// Plain types + zod schema for the AI settings stored in the browser.
//
// The API key is encrypted at rest (see ./crypto). The other fields
// (base URL, model, topNCategories) are plain text — they're not secrets.
//
// Feature availability is derived, not stored: a BYO feature is
// "ready" if and only if an API key is configured. There is no
// per-user toggle.

import { z } from "zod";

// Capped to match the BE schema for /reports/monthly-insights
// (top_n_categories: ge=1, le=20). Larger values would 422.
export const TOP_N_CATEGORIES_MIN = 1;
export const TOP_N_CATEGORIES_MAX = 20;
export const TOP_N_CATEGORIES_DEFAULT = 20;

export const ZAiConfig = z.object({
	baseUrl: z
		.string()
		.trim()
		.min(1, "Base URL is required")
		.url("Base URL must be a valid URL"),
	model: z.string().trim().min(1, "Model is required"),
	topNCategories: z
		.number()
		.int()
		.min(TOP_N_CATEGORIES_MIN)
		.max(TOP_N_CATEGORIES_MAX),
});
export type AiConfig = z.infer<typeof ZAiConfig>;

// Encrypted blob stored under `spendrift.ai.v1`. `v` lets us migrate later.
export type EncryptedBlob = {
	v: 1;
	ciphertext: string; // base64
	iv: string; // base64
	salt: string; // base64 (PBKDF2 salt)
};

// Settings as held in memory after decryption. Only the API key is
// sensitive; the rest is mirrored from the sibling plaintext config.
export type AiSettings = {
	apiKey: string;
	baseUrl: string;
	model: string;
	topNCategories: number;
};

export const DEFAULT_CONFIG: AiConfig = {
	baseUrl: "https://api.anthropic.com",
	model: "claude-sonnet-4-6",
	topNCategories: TOP_N_CATEGORIES_DEFAULT,
};

export const DEFAULT_SETTINGS: AiSettings = {
	apiKey: "",
	...DEFAULT_CONFIG,
};

/**
 * True when a BYO feature can run (an API key is configured for this
 * browser). Centralised so callers don't all reach into storage.
 */
export function isByoFeatureReady(hasKey: boolean): boolean {
	return hasKey;
}
