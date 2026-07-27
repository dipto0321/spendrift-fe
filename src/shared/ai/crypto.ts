// AES-GCM encryption for the user's API key, with PBKDF2 key derivation
// from the session's JWT subject claim.
//
// Threat model: a stolen localStorage blob (e.g. browser sync, backup, or
// malicious extension reading storage) should not directly yield the API
// key. We rely on the JWT being held only in the live session — without
// the active token the attacker cannot derive the AES key.
//
// Trade-offs:
//   * Salt is static per app, not per user. PBKDF2 with a per-user salt
//     would break key rotation (a token refresh would silently invalidate
//     the user's saved key). The JWT itself provides the entropy that
//     matters; the salt just blocks rainbow-table attacks.
//   * AES-GCM IV is fresh per encryption (96 bits from crypto.getRandomValues).
//   * 100k PBKDF2 iterations matches the OWASP guidance for SHA-256 in 2023+.

import type { EncryptedBlob } from "./types";

const PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH_BITS = 256;
const IV_LENGTH_BYTES = 12;
// Static app salt. The JWT subject is the real entropy; this salt only
// needs to be globally unique so that a database of pre-computed PBKDF2
// outputs for common JWTs would not be useful. Rotate this value in a
// future migration (bump `v` in EncryptedBlob) if it ever leaks.
const APP_SALT = new TextEncoder().encode("spendrift.ai.v1.salt");

function isBrowser(): boolean {
	return typeof globalThis.window !== "undefined";
}

function subtle(): SubtleCrypto {
	if (!isBrowser()) {
		throw new Error("Web Crypto API is only available in the browser.");
	}
	return globalThis.crypto.subtle;
}

function bytesToBase64(bytes: Uint8Array): string {
	let binary = "";
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return globalThis.btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
	const binary = globalThis.atob(b64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

async function deriveKey(
	entropy: string,
	salt: Uint8Array,
): Promise<CryptoKey> {
	const material = await subtle().importKey(
		"raw",
		new TextEncoder().encode(entropy),
		"PBKDF2",
		false,
		["deriveKey"],
	);
	return subtle().deriveKey(
		{
			name: "PBKDF2",
			salt,
			iterations: PBKDF2_ITERATIONS,
			hash: "SHA-256",
		},
		material,
		{ name: "AES-GCM", length: KEY_LENGTH_BITS },
		false,
		["encrypt", "decrypt"],
	);
}

/**
 * Encrypt a plaintext string. Returns the base64-encoded ciphertext, IV,
 * and salt so the caller can persist all three together.
 */
export async function encrypt(
	plaintext: string,
	entropy: string,
): Promise<EncryptedBlob> {
	if (!entropy) {
		throw new Error("Cannot encrypt without a session.");
	}
	const iv = globalThis.crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
	const key = await deriveKey(entropy, APP_SALT);
	const ciphertext = new Uint8Array(
		await subtle().encrypt(
			{ name: "AES-GCM", iv },
			key,
			new TextEncoder().encode(plaintext),
		),
	);
	return {
		v: 1,
		ciphertext: bytesToBase64(ciphertext),
		iv: bytesToBase64(iv),
		salt: bytesToBase64(APP_SALT),
	};
}

/**
 * Decrypt a blob produced by `encrypt` using the same entropy. Throws if
 * the blob was tampered with (AES-GCM authenticates the ciphertext).
 */
export async function decrypt(
	blob: EncryptedBlob,
	entropy: string,
): Promise<string> {
	if (!entropy) {
		throw new Error("Cannot decrypt without a session.");
	}
	if (blob.v !== 1) {
		throw new Error(`Unsupported encrypted blob version: ${blob.v}`);
	}
	const salt = APP_SALT; // v1 always uses the app salt
	const key = await deriveKey(entropy, salt);
	const plaintext = new Uint8Array(
		await subtle().decrypt(
			{ name: "AES-GCM", iv: base64ToBytes(blob.iv) },
			key,
			base64ToBytes(blob.ciphertext),
		),
	);
	return new TextDecoder().decode(plaintext);
}

// Exposed only for tests; production code should never need the salt
// directly because v1 blobs always use the app constant.
export const __test__ = { APP_SALT, PBKDF2_ITERATIONS, IV_LENGTH_BYTES };
