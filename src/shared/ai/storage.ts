// Persistence for the AI settings. Two localStorage keys:
//
//   spendrift.ai.v1      → EncryptedBlob { v, ciphertext, iv, salt }
//   spendrift.ai.config  → plaintext AiConfig (baseUrl, model)
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
 *
 * Also migrates any v1 config blob that still carries the now-removed
 * `features` field — we rewrite it as the slim shape so future reads
 * don't see stale data.
 */
export function purgeLegacySettings(): void {
	remove(LEGACY_KEY);

	if (!isBrowser()) return;
	const raw = globalThis.window.localStorage.getItem(CONFIG_KEY);
	if (!raw) return;
	try {
		const parsed = JSON.parse(raw) as Record<string, unknown>;
		if ("features" in parsed) {
			const { features: _features, ...rest } = parsed;
			globalThis.window.localStorage.setItem(CONFIG_KEY, JSON.stringify(rest));
		}
	} catch {
		// Unparseable — ignore; the next save will overwrite it.
	}
}

/**
 * Strict read — only honours keys that exist on the current schema. Any
 * unknown field is dropped. This means the stored config always matches
 * `AiConfig` even after schema changes.
 */
function readConfig(): AiConfig {
	const stored = readJson<Partial<AiConfig>>(CONFIG_KEY);
	if (!stored) return { ...DEFAULT_CONFIG };
	const baseUrl =
		typeof stored.baseUrl === "string"
			? stored.baseUrl
			: DEFAULT_CONFIG.baseUrl;
	const model =
		typeof stored.model === "string" ? stored.model : DEFAULT_CONFIG.model;
	const topNCategories = clampTopNCategories(
		typeof stored.topNCategories === "number"
			? stored.topNCategories
			: DEFAULT_CONFIG.topNCategories,
	);
	return { baseUrl, model, topNCategories };
}

// Defensive clamp — protects against out-of-range values written by
// older builds or hand-edited storage. The BE also validates (ge=1,
// le=20), so this keeps the FE in lockstep.
function clampTopNCategories(n: number): number {
	if (!Number.isFinite(n)) return DEFAULT_CONFIG.topNCategories;
	const rounded = Math.round(n);
	if (rounded < 1) return 1;
	if (rounded > 20) return 20;
	return rounded;
}

function writeConfig(config: AiConfig): void {
	writeJson(CONFIG_KEY, config);
}

/**
 * Returns the in-memory settings. The synchronous loader returns the
 * plaintext config but an empty `apiKey` — decryption is async. Use
 * `loadAiSettingsAsync` when you need the key (e.g. to make an LLM call).
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
 *
 * Note: an empty `apiKey` is treated as "no change" — the existing
 * encrypted blob (if any) is left in place. Call `clearAiSettings` to
 * explicitly wipe a saved key.
 */
export async function saveAiSettings(settings: AiSettings): Promise<void> {
	if (!isBrowser()) {
		throw new Error("Cannot save AI settings: not in a browser.");
	}

	const { apiKey, ...configLike } = settings;
	const config: AiConfig = {
		baseUrl: configLike.baseUrl,
		model: configLike.model,
		topNCategories: clampTopNCategories(configLike.topNCategories),
	};
	writeConfig(config);

	if (apiKey.length === 0) {
		// No change to the encrypted blob.
		return;
	}

	const entropy = getActiveSessionEntropy();
	if (!entropy) {
		throw new Error(
			"Cannot save your API key: no active session. Sign in and try again.",
		);
	}
	const blob = await encrypt(apiKey, entropy);
	writeJson(ENCRYPTED_KEY, blob);
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

/**
 * Returns true when an encrypted blob is stored, without decrypting it.
 * Use this in UI surfaces that need to know "is a key saved?" without
 * paying for PBKDF2 (e.g. showing a masked placeholder in a form field).
 */
export function hasEncryptedBlob(): boolean {
	if (!isBrowser()) return false;
	return globalThis.window.localStorage.getItem(ENCRYPTED_KEY) !== null;
}
