// Persistence for the AI settings. Two localStorage keys:
//
//   spendrift.ai.v1      → EncryptedBlob { v, ciphertext, iv, salt }
//   spendrift.ai.config  → plaintext AiConfig (baseUrl, model, features)
//
// The plaintext blob holds only non-sensitive metadata (no API key). The
// API key is encrypted with a key derived from the active JWT subject and
// the app salt. Reading the key requires both the blob and a live session.

import { decrypt, encrypt } from "./crypto";
import { getActiveSessionEntropy } from "./jwt";
import {
	type AiConfig,
	type AiSettings,
	DEFAULT_CONFIG,
	DEFAULT_SETTINGS,
	type EncryptedBlob,
} from "./types";

const ENCRYPTED_KEY = "spendrift.ai.v1";
const CONFIG_KEY = "spendrift.ai.config";
const LEGACY_KEY = "spendrift:ai-settings";

function isBrowser(): boolean {
	return typeof globalThis.window !== "undefined";
}

function readJson<T>(key: string): T | null {
	if (!isBrowser()) return null;
	const raw = globalThis.window.localStorage.getItem(key);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as T;
	} catch {
		return null;
	}
}

function writeJson(key: string, value: unknown): void {
	if (!isBrowser()) return;
	globalThis.window.localStorage.setItem(key, JSON.stringify(value));
}

function remove(key: string): void {
	if (!isBrowser()) return;
	globalThis.window.localStorage.removeItem(key);
}

/**
 * One-time cleanup of the pre-encryption plaintext key. The legacy blob
 * was `{ apiKey, baseUrl, model, features }` in cleartext — we cannot
 * decrypt it, so we silently drop it. Anything written after this point
 * uses the encrypted format.
 */
export function purgeLegacySettings(): void {
	remove(LEGACY_KEY);
}

function readConfig(): AiConfig {
	// Best-effort: a malformed config falls back to defaults rather than
	// throwing. The user can re-enter their base URL and model.
	const stored = readJson<Partial<AiConfig>>(CONFIG_KEY);
	if (!stored)
		return { ...DEFAULT_CONFIG, features: { ...DEFAULT_CONFIG.features } };
	return {
		baseUrl:
			typeof stored.baseUrl === "string"
				? stored.baseUrl
				: DEFAULT_CONFIG.baseUrl,
		model:
			typeof stored.model === "string" ? stored.model : DEFAULT_CONFIG.model,
		features: {
			smartReport:
				typeof stored.features?.smartReport === "boolean"
					? stored.features.smartReport
					: DEFAULT_CONFIG.features.smartReport,
			receiptOcr:
				typeof stored.features?.receiptOcr === "boolean"
					? stored.features.receiptOcr
					: DEFAULT_CONFIG.features.receiptOcr,
		} as AiConfig["features"],
	};
}

function writeConfig(config: AiConfig): void {
	writeJson(CONFIG_KEY, config);
}

/**
 * Returns the in-memory settings, decrypting the API key with the active
 * JWT subject. Returns the defaults (with empty apiKey) when:
 *   - we're not in the browser
 *   - there's no active session
 *   - there's no encrypted blob stored yet
 *   - decryption fails (corrupt blob, session mismatch)
 *
 * `apiKey` is "" in every "no key available" case so callers can simply
 * check `settings.apiKey.length > 0` to know whether AI features are
 * configured. The plaintext config (baseUrl, model, features) is always
 * returned regardless of key state.
 */
export function loadAiSettings(): AiSettings {
	purgeLegacySettings();

	const config = readConfig();
	const blob = readJson<EncryptedBlob>(ENCRYPTED_KEY);

	if (!blob || typeof globalThis.window === "undefined") {
		return { apiKey: "", ...config };
	}

	const entropy = getActiveSessionEntropy();
	if (!entropy) {
		return { apiKey: "", ...config };
	}

	// Decrypt synchronously is impossible (Web Crypto is async), so the
	// caller should use `loadAiSettingsAsync` when it needs the key. This
	// sync version returns the plaintext fields only — useful for the page
	// header that needs the toggle states without the key.
	return { apiKey: "", ...config };
}

/**
 * Async variant: decrypts the API key when a session is available.
 * Use this when you need to make an LLM call.
 */
export async function loadAiSettingsAsync(): Promise<AiSettings> {
	purgeLegacySettings();

	const config = readConfig();
	const blob = readJson<EncryptedBlob>(ENCRYPTED_KEY);

	if (!blob) return { apiKey: "", ...config };

	const entropy = getActiveSessionEntropy();
	if (!entropy) return { apiKey: "", ...config };

	try {
		const apiKey = await decrypt(blob, entropy);
		return { apiKey, ...config };
	} catch {
		// Corrupt blob or session mismatch — drop the encrypted blob so the
		// user can re-enter their key without seeing stale metadata.
		remove(ENCRYPTED_KEY);
		return { apiKey: "", ...config };
	}
}

/**
 * Encrypt and persist the settings. The API key is encrypted with the
 * current JWT subject; if there's no session, throws.
 */
export async function saveAiSettings(settings: AiSettings): Promise<void> {
	if (!isBrowser()) {
		throw new Error("Cannot save AI settings: not in a browser.");
	}

	const { apiKey, ...configLike } = settings;
	const config: AiConfig = {
		baseUrl: configLike.baseUrl,
		model: configLike.model,
		features: { ...configLike.features },
	};
	writeConfig(config);

	if (apiKey.length > 0) {
		const entropy = getActiveSessionEntropy();
		if (!entropy) {
			throw new Error(
				"Cannot save your API key: no active session. Sign in and try again.",
			);
		}
		const blob = await encrypt(apiKey, entropy);
		writeJson(ENCRYPTED_KEY, blob);
	} else {
		// Saving with an empty key clears any previously stored encrypted blob.
		remove(ENCRYPTED_KEY);
	}
}

/**
 * Remove all AI-related localStorage entries. Used by sign-out (via
 * `clearAiSettings`) and by the page-level "Clear" action.
 */
export function clearAiSettings(): void {
	remove(ENCRYPTED_KEY);
	remove(CONFIG_KEY);
	remove(LEGACY_KEY);
}

// Re-export the default for callers that want a typed empty-state.
export { DEFAULT_SETTINGS };
