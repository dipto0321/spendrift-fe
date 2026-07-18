import { describe, expect, it } from "vitest";
import { mapParsedExpense, toParseExpensesBody } from "./dto";

describe("mapParsedExpense", () => {
	it("converts decimal-string money to number and snake_case keys", () => {
		expect(
			mapParsedExpense({
				amount: "120.50",
				description: "coffee",
				category_id: "c1",
				type: "want",
				date: "2026-07-18",
			}),
		).toEqual({
			amount: 120.5,
			description: "coffee",
			categoryId: "c1",
			type: "want",
			date: "2026-07-18",
		});
	});

	it("maps a null category_id to undefined", () => {
		const parsed = mapParsedExpense({
			amount: "40",
			description: "bus",
			category_id: null,
			type: "need",
			date: "2026-07-18",
		});
		expect(parsed.categoryId).toBeUndefined();
	});
});

describe("toParseExpensesBody", () => {
	it("emits snake_case keys and trimmed category descriptors", () => {
		expect(
			toParseExpensesBody({
				text: "coffee 120, bus 40",
				defaultDate: "2026-07-18",
				categories: [{ id: "c1", name: "Food" }],
			}),
		).toEqual({
			text: "coffee 120, bus 40",
			default_date: "2026-07-18",
			categories: [{ id: "c1", name: "Food" }],
		});
	});
});
