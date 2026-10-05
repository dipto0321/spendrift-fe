import { describe, expect, it } from "vitest";
import {
	parseStructuredLine,
	parseStructuredText,
	splitTopLevel,
} from "./smartPaste";

describe("splitTopLevel", () => {
	it("splits on top-level + only", () => {
		expect(splitTopLevel("a + b")).toEqual(["a ", " b"]);
	});

	it("ignores + inside brackets", () => {
		expect(splitTopLevel("(a + b) + c")).toEqual(["(a + b) ", " c"]);
	});

	it("keeps fully bracketed expressions as one segment", () => {
		expect(splitTopLevel("((5*6)+(89-50)+(40/2)-50)")).toEqual([
			"((5*6)+(89-50)+(40/2)-50)",
		]);
	});
});

describe("parseStructuredLine", () => {
	it("splits one label per segment", () => {
		expect(parseStructuredLine("Item 1 + Item 2 = 100 + 200")).toEqual([
			{ description: "Item 1", amount: 100 },
			{ description: "Item 2", amount: 200 },
		]);
	});

	it("evaluates a bracketed group as one item's amount", () => {
		expect(
			parseStructuredLine("Item 1 and 2 + item 3 = (100 + 200) + 50"),
		).toEqual([
			{ description: "Item 1 and 2", amount: 300 },
			{ description: "item 3", amount: 50 },
		]);
	});

	it("sums a single bracketed item", () => {
		expect(parseStructuredLine("Groceries = (100 + 200)")).toEqual([
			{ description: "Groceries", amount: 300 },
		]);
	});

	it("evaluates the nested math example", () => {
		expect(parseStructuredLine("Pens = ((5*6)+(89-50)+(40/2)-50)")).toEqual([
			{ description: "Pens", amount: 39 },
		]);
	});

	it("returns null without an equals sign", () => {
		expect(parseStructuredLine("coffee 120")).toBeNull();
	});

	it("returns null when item counts mismatch", () => {
		expect(parseStructuredLine("Taxi = (20 * 2) + 5")).toBeNull();
		expect(parseStructuredLine("A + B = 100")).toBeNull();
	});

	it("returns null for empty labels or segments", () => {
		expect(parseStructuredLine(" = 100")).toBeNull();
		expect(parseStructuredLine("Item = ")).toBeNull();
	});

	it("returns null for non-positive or bad math", () => {
		expect(parseStructuredLine("Item = 100 - 200")).toBeNull();
		expect(parseStructuredLine("Item = 10 / 0")).toBeNull();
	});
});

describe("parseStructuredText", () => {
	it("returns free-text when no equals sign is present", () => {
		expect(parseStructuredText("coffee 120\nbus 40", "2026-10-05")).toEqual({
			kind: "free-text",
		});
	});

	it("parses multiple structured lines into rows", () => {
		const result = parseStructuredText(
			"Item 1 + Item 2 = 100 + 200\nGroceries = (50 + 50)",
			"2026-10-05",
		);
		expect(result).toEqual({
			kind: "ok",
			rows: [
				{
					amount: 100,
					description: "Item 1",
					type: "need",
					date: "2026-10-05",
				},
				{
					amount: 200,
					description: "Item 2",
					type: "need",
					date: "2026-10-05",
				},
				{
					amount: 100,
					description: "Groceries",
					type: "need",
					date: "2026-10-05",
				},
			],
		});
	});

	it("reports the offending line number (1-based, ignoring blanks)", () => {
		const result = parseStructuredText(
			"Item 1 = 100\n\nBad = 10 / 0",
			"2026-10-05",
		);
		expect(result).toEqual({ kind: "invalid", line: 3 });
	});
});
