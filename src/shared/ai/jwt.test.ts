import { describe, expect, it } from "vitest";
import { getJwtSubject } from "./jwt";

// A canonical HS256 JWT with payload `{"sub":"alice@example.com","exp":1700000000}`.
// header: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`
// payload: `eyJzdWIiOiJhbGljZUBleGFtcGxlLmNvbSIsImV4cCI6MTcwMDAwMDAwMH0`
// (signature is a placeholder — we only read the payload)
const ALICE_JWT =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhbGljZUBleGFtcGxlLmNvbSIsImV4cCI6MTcwMDAwMDAwMH0.fake-signature";

// Payload without `sub` — falls back to the whole payload string.
const NO_SUB_JWT =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MDAwMDAwMDB9.fake";

describe("ai/jwt", () => {
	it("extracts the sub claim from a known JWT", () => {
		expect(getJwtSubject(ALICE_JWT)).toBe("alice@example.com");
	});

	it("falls back to the payload string when sub is missing", () => {
		expect(getJwtSubject(NO_SUB_JWT)).toBe(
			"eyJleHAiOjE3MDAwMDAwMDB9",
		);
	});

	it("returns the only segment when the token has no signature", () => {
		// 2-part JWT is malformed; we still return the (would-be) payload.
		expect(getJwtSubject("onlyone")).toBe("onlyone");
		// 3-part JWT — even an "invalid" one with junk in the middle — falls
		// through to whatever base64UrlDecode yields. Don't assert exact
		// equality: the goal is to never throw.
		expect(() => getJwtSubject("a.b.c")).not.toThrow();
	});

	it("returns empty string for empty input", () => {
		expect(getJwtSubject("")).toBe("");
	});

	it("survives malformed base64 by returning the payload segment", () => {
		// `!!!` is invalid base64; the parser throws and we fall back.
		const bad = "header.!!!.sig";
		expect(getJwtSubject(bad)).toBe("!!!");
	});
});