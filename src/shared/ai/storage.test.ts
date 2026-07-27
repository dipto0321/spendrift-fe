// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as tokens from "@/shared/api/tokens";
import {
	clearAiSettings,
	hasEncryptedBlob,
	loadAiSettings,
	loadAiSettingsAsync,
	purgeLegacySettings,
	saveAiSettings,
} from "./storage";

const ENTROPY = "alice@example.com";

async function setSession(entropy: string | null) {
	const jwt =
		entropy === null
			? null
			: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ sub: entropy }))}.sig`;
	vi.spyOn(tokens, "getAccessToken").mockReturnValue(jwt);
}

beforeEach(async () => {
	localStorage.clear();
	await setSession(ENTROPY);
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("ai/storage", () => {
	it("round-trips the API key through localStorage encrypted at rest", async () => {
		await saveAiSettings({
			apiKey: "sk-or-v1-very-secret",
			baseUrl: "https://openrouter.ai/api/v1",
			model: "anthropic/claude-sonnet-4-5",
		});

		// Plaintext config is readable synchronously and without a session.
		const configRaw = localStorage.getItem("spendrift.ai.config");
		expect(configRaw).not.toBeNull();
		const configParsed = JSON.parse(configRaw as string);
		expect(configParsed.baseUrl).toBe("https://openrouter.ai/api/v1");
		expect(configParsed.model).toBe("anthropic/claude-sonnet-4-5");

		// Encrypted blob: ciphertext does NOT contain the plaintext key.
		const blobRaw = localStorage.getItem("spendrift.ai.v1");
		expect(blobRaw).not.toBeNull();
		expect(blobRaw).not.toContain("sk-or-v1-very-secret");

		const loaded = await loadAiSettingsAsync();
		expect(loaded.apiKey).toBe("sk-or-v1-very-secret");
		expect(loaded.baseUrl).toBe("https://openrouter.ai/api/v1");
	});

	it("returns empty apiKey when the session is missing but the blob exists", async () => {
		await saveAiSettings({
			apiKey: "sk-test",
			baseUrl: "https://api.anthropic.com",
			model: "claude-sonnet-4-6",
		});

		await setSession(null);
		const loaded = await loadAiSettingsAsync();
		expect(loaded.apiKey).toBe("");
		// The plaintext config is still readable.
		expect(loaded.baseUrl).toBe("https://api.anthropic.com");
	});

	it("drops the encrypted blob when decryption fails (corrupt blob or key mismatch)", async () => {
		await saveAiSettings({
			apiKey: "sk-test",
			baseUrl: "https://api.anthropic.com",
			model: "claude-sonnet-4-6",
		});

		// Simulate a token rotation: the JWT subject changes, so decryption
		// cannot succeed with the old blob. The fallback should clear it.
		await setSession("bob@example.com");
		const loaded = await loadAiSettingsAsync();

		expect(loaded.apiKey).toBe("");
		expect(localStorage.getItem("spendrift.ai.v1")).toBeNull();
	});

	it("purgeLegacySettings removes the pre-encryption plaintext key", () => {
		localStorage.setItem(
			"spendrift:ai-settings",
			JSON.stringify({ apiKey: "sk-plaintext", baseUrl: "x", model: "y" }),
		);
		purgeLegacySettings();
		expect(localStorage.getItem("spendrift:ai-settings")).toBeNull();
	});

	it("migrates a stored config that still carries the removed features field", () => {
		// Simulate a config blob written by an older build of the FE.
		localStorage.setItem(
			"spendrift.ai.config",
			JSON.stringify({
				baseUrl: "https://api.anthropic.com",
				model: "claude-sonnet-4-6",
				features: { smartReport: true, receiptOcr: false },
			}),
		);

		// purgeLegacySettings runs on the next load and rewrites the blob.
		purgeLegacySettings();

		const rewritten = JSON.parse(
			localStorage.getItem("spendrift.ai.config") as string,
		);
		expect(rewritten).toEqual({
			baseUrl: "https://api.anthropic.com",
			model: "claude-sonnet-4-6",
		});
		expect(rewritten.features).toBeUndefined();

		// And the loader reads the migrated shape cleanly.
		const loaded = loadAiSettings();
		expect(loaded.baseUrl).toBe("https://api.anthropic.com");
		expect(loaded.model).toBe("claude-sonnet-4-6");
	});

	it("clearAiSettings removes all AI keys", async () => {
		await saveAiSettings({
			apiKey: "sk-test",
			baseUrl: "https://api.anthropic.com",
			model: "claude-sonnet-4-6",
		});
		localStorage.setItem("spendrift:ai-settings", "{}");
		clearAiSettings();
		expect(localStorage.getItem("spendrift.ai.v1")).toBeNull();
		expect(localStorage.getItem("spendrift.ai.config")).toBeNull();
		expect(localStorage.getItem("spendrift:ai-settings")).toBeNull();
	});

	it("saveAiSettings with empty apiKey leaves a previously stored blob intact", async () => {
		await saveAiSettings({
			apiKey: "sk-first",
			baseUrl: "https://api.anthropic.com",
			model: "claude-sonnet-4-6",
		});
		const before = localStorage.getItem("spendrift.ai.v1");
		expect(before).not.toBeNull();

		await saveAiSettings({
			apiKey: "",
			baseUrl: "https://api.anthropic.com",
			model: "claude-sonnet-4-6",
		});
		// Empty key on Save = no change. The blob remains; use clearAiSettings
		// to explicitly wipe.
		expect(localStorage.getItem("spendrift.ai.v1")).toBe(before);
	});

	it("loadAiSettings synchronously returns the plaintext config and empty apiKey", async () => {
		await saveAiSettings({
			apiKey: "sk-or-v1-abc",
			baseUrl: "https://openrouter.ai/api/v1",
			model: "anthropic/claude-sonnet-4-5",
		});
		const sync = loadAiSettings();
		// Sync loader can't decrypt; apiKey is empty but the metadata is there.
		expect(sync.apiKey).toBe("");
		expect(sync.baseUrl).toBe("https://openrouter.ai/api/v1");
	});

	it("hasEncryptedBlob is true after save and false after clearAiSettings", async () => {
		expect(hasEncryptedBlob()).toBe(false);
		await saveAiSettings({
			apiKey: "sk-or-v1-abc",
			baseUrl: "https://openrouter.ai/api/v1",
			model: "anthropic/claude-sonnet-4-5",
		});
		expect(hasEncryptedBlob()).toBe(true);
		clearAiSettings();
		expect(hasEncryptedBlob()).toBe(false);
	});
});
