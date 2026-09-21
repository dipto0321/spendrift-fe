import { describe, expect, it } from "vitest";
import { buildTaxCopyText } from "./copyText";
import type { TaxHead } from "./types";

const heads: TaxHead[] = [
	{
		headCode: "food_clothing_essentials",
		headName: "Food, Clothing & Other Essentials",
		description: "desc",
		amount: 100.5,
		categoryAllocations: [],
	},
	{
		headCode: "accommodation",
		headName: "Accommodation Expense",
		description: "desc",
		amount: 0,
		categoryAllocations: [],
	},
];

describe("buildTaxCopyText", () => {
	it("formats heads as TSV with a total row", () => {
		expect(buildTaxCopyText(heads, "2025-26")).toBe(
			"IT-10BB 2025-26\nFood, Clothing & Other Essentials\t100.50\nAccommodation Expense\t0.00\nTotal\t100.50",
		);
	});
});
