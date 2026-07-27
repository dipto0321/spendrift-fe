// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { decrypt, encrypt } from "./crypto";

// The crypto module uses Web Crypto (`crypto.subtle`, `crypto.getRandomValues`)
// so the tests run in a DOM environment, not the default node env in
// vitest.config.ts.

const ENTROPY = "alice@example.com";

describe("ai/crypto", () => {
	it("round-trips an API key encrypted with a given entropy", async () => {
		const plaintext = "sk-ant-api03-very-secret-key";
		const blob = await encrypt(plaintext, ENTROPY);

		// v1 envelope: base64 ciphertext/iv/salt, all present.
		expect(blob.v).toBe(1);
		expect(typeof blob.ciphertext).toBe("string");
		expect(typeof blob.iv).toBe("string");
		expect(typeof blob.salt).toBe("string");

		const decrypted = await decrypt(blob, ENTROPY);
		expect(decrypted).toBe(plaintext);
	});

	it("produces a fresh IV on every encryption", async () => {
		const a = await encrypt("hello", ENTROPY);
		const b = await encrypt("hello", ENTROPY);
		expect(a.iv).not.toBe(b.iv);
		expect(a.ciphertext).not.toBe(b.ciphertext);
	});

	it("fails to decrypt when the entropy is wrong", async () => {
		const blob = await encrypt("sk-test", ENTROPY);
		await expect(decrypt(blob, "someone-else@example.com")).rejects.toThrow();
	});

	it("refuses to run without entropy", async () => {
		await expect(encrypt("hi", "")).rejects.toThrow();
	});

	it("rejects an unknown envelope version", async () => {
		const blob = await encrypt("hi", ENTROPY);
		const broken = { ...blob, v: 2 as unknown as 1 };
		await expect(decrypt(broken, ENTROPY)).rejects.toThrow();
	});

	it("handles unicode plaintext", async () => {
		const plaintext = "🔐—Spendrift—API—key—测试";
		const blob = await encrypt(plaintext, ENTROPY);
		expect(await decrypt(blob, ENTROPY)).toBe(plaintext);
	});
});