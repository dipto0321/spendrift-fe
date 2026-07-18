import { describe, expect, it } from "vitest";
import {
	type BulkExpenseRowValues,
	bulkExpenseFormSchema,
	isBlankBulkRow,
} from "./schema";

function row(
	overrides: Partial<BulkExpenseRowValues> = {},
): BulkExpenseRowValues {
	return {
		amount: "120.50",
		categoryId: "c1",
		description: "coffee",
		type: "want",
		...overrides,
	};
}

describe("bulkExpenseFormSchema", () => {
	it("accepts a date plus one or more valid rows", () => {
		const result = bulkExpenseFormSchema.safeParse({
			date: "2026-07-18",
			rows: [row(), row({ amount: "40", type: "need" })],
		});
		expect(result.success).toBe(true);
	});

	it("rejects an empty rows array", () => {
		const result = bulkExpenseFormSchema.safeParse({
			date: "2026-07-18",
			rows: [],
		});
		expect(result.success).toBe(false);
	});

	it("rejects a missing date", () => {
		const result = bulkExpenseFormSchema.safeParse({
			date: "",
			rows: [row()],
		});
		expect(result.success).toBe(false);
	});

	it("rejects a row with a non-positive amount", () => {
		const result = bulkExpenseFormSchema.safeParse({
			date: "2026-07-18",
			rows: [row({ amount: "0" })],
		});
		expect(result.success).toBe(false);
	});

	it("rejects a row with a missing category or description", () => {
		expect(
			bulkExpenseFormSchema.safeParse({
				date: "2026-07-18",
				rows: [row({ categoryId: "" })],
			}).success,
		).toBe(false);
		expect(
			bulkExpenseFormSchema.safeParse({
				date: "2026-07-18",
				rows: [row({ description: "  " })],
			}).success,
		).toBe(false);
	});

	it("rows carry no date field — the batch date is shared", () => {
		const parsed = bulkExpenseFormSchema.parse({
			date: "2026-07-18",
			rows: [row()],
		});
		expect("date" in parsed.rows[0]).toBe(false);
	});
});

describe("isBlankBulkRow", () => {
	it("is true only when amount, description, and category are all empty", () => {
		expect(
			isBlankBulkRow({
				amount: "",
				categoryId: "",
				description: "",
				type: "need",
			}),
		).toBe(true);
		expect(
			isBlankBulkRow({
				amount: " ",
				categoryId: "",
				description: "  ",
				type: "want",
			}),
		).toBe(true);
		expect(
			isBlankBulkRow({
				amount: "5",
				categoryId: "",
				description: "",
				type: "need",
			}),
		).toBe(false);
		expect(
			isBlankBulkRow({
				amount: "",
				categoryId: "c1",
				description: "",
				type: "need",
			}),
		).toBe(false);
		expect(
			isBlankBulkRow({
				amount: "",
				categoryId: "",
				description: "x",
				type: "need",
			}),
		).toBe(false);
	});
});
