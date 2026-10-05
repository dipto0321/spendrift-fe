import { describe, expect, it } from "vitest";
import { evaluateExpression } from "./expression";

describe("evaluateExpression", () => {
	it("adds and subtracts left-to-right", () => {
		expect(evaluateExpression("2 + 3")).toBe(5);
		expect(evaluateExpression("10 - 3 - 2")).toBe(5);
	});

	it("binds * and / tighter than + and -", () => {
		expect(evaluateExpression("2 + 3 * 4")).toBe(14);
		expect(evaluateExpression("10 - 4 / 2")).toBe(8);
	});

	it("honors parentheses", () => {
		expect(evaluateExpression("(2 + 3) * 4")).toBe(20);
	});

	it("evaluates the user's nested example", () => {
		expect(evaluateExpression("((5*6)+(89-50)+(40/2)-50)")).toBe(39);
	});

	it("supports nested grouping around a top-level tail", () => {
		expect(evaluateExpression("(100 + 200) + 50")).toBe(350);
	});

	it("supports unary minus", () => {
		expect(evaluateExpression("-50 + 100")).toBe(50);
		expect(evaluateExpression("2 * -3")).toBe(-6);
		expect(evaluateExpression("-(2 + 3)")).toBe(-5);
	});

	it("divides to decimals", () => {
		expect(evaluateExpression("10 / 4")).toBe(2.5);
	});

	it("rounds to two decimals", () => {
		expect(evaluateExpression("10 / 3")).toBe(3.33);
	});

	it("strips thousands separators and currency symbols", () => {
		expect(evaluateExpression("1,000 + 500")).toBe(1500);
		expect(evaluateExpression("$50 + 30")).toBe(80);
		expect(evaluateExpression("৳100 + 20")).toBe(120);
	});

	it("accepts leading and trailing decimal points", () => {
		expect(evaluateExpression(".5 + 1")).toBe(1.5);
		expect(evaluateExpression("5. + 1")).toBe(6);
	});

	it("throws on division by zero", () => {
		expect(() => evaluateExpression("10 / 0")).toThrow();
	});

	it("throws on malformed input", () => {
		expect(() => evaluateExpression("")).toThrow();
		expect(() => evaluateExpression("abc")).toThrow();
		expect(() => evaluateExpression("(1 + 2")).toThrow();
		expect(() => evaluateExpression("1 +")).toThrow();
	});
});
