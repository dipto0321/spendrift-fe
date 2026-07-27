// Plain types + zod schema for the AI settings stored in the browser.
//
// The API key is encrypted at rest (see ./crypto). The other fields are
// plain text — base URL and model name aren't secrets, and the feature
// toggles need to be readable by the UI without round-tripping PBKDF2 on
// every render.

import { z } from "zod";

// Only features that run via the user's own provider key are here.
// Built-in features (Smart Paste, Budget Pacing, Recurring Detector,
// Anomaly Flagging, NL Search) are served by the server's Gemini key and
// are not user-toggleable.
export const ZByoFeatureKey = z.enum(["smartReport", "receiptOcr"]);
export type ByoFeatureKey = z.infer<typeof ZByoFeatureKey>;

export const ZAiConfig = z.object({
	baseUrl: z
		.string()
		.trim()
		.min(1, "Base URL is required")
		.url("Base URL must be a valid URL"),
	model: z.string().trim().min(1, "Model is required"),
	features: z.object({
		smartReport: z.boolean(),
		receiptOcr: z.boolean(),
	}),
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
	features: Record<ByoFeatureKey, boolean>;
};

// The defaults match the AI Settings page's empty state. Smart Paste is
// built-in (no toggle here); Smart Report is the first BYO feature; Receipt
// OCR is a future BYO feature.
export const DEFAULT_CONFIG: AiConfig = {
	baseUrl: "https://api.anthropic.com",
	model: "claude-sonnet-4-6",
	features: {
		smartReport: false,
		receiptOcr: false,
	},
};

export const DEFAULT_SETTINGS: AiSettings = {
	apiKey: "",
	...DEFAULT_CONFIG,
	features: { ...DEFAULT_CONFIG.features },
};
