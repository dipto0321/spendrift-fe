import { describe, expect, it } from "vitest";
import {
	currentFiscalYear,
	fiscalYearBounds,
	fiscalYearFromDate,
	fiscalYearOptions,
	isValidFiscalYear,
} from "./fiscalYears";

describe("tax fiscal-year helpers", () => {
	it("validates YYYY-YY with +1 year", () => {
		expect(isValidFiscalYear("2025-26")).toBe(true);
		expect(isValidFiscalYear("1999-00")).toBe(true);
		expect(isValidFiscalYear("2025-27")).toBe(false);
		expect(isValidFiscalYear("25-26")).toBe(false);
		expect(isValidFiscalYear("2025-2026")).toBe(false);
	});

	it("derives bounds as Jul 1 → Jun 30", () => {
		expect(fiscalYearBounds("2025-26")).toEqual({
			startDate: "2025-07-01",
			endDate: "2026-06-30",
		});
	});

	it("maps dates to income year (July cutoff)", () => {
		expect(fiscalYearFromDate(new Date(2025, 6, 1))).toBe("2025-26");
		expect(fiscalYearFromDate(new Date(2025, 5, 30))).toBe("2024-25");
		expect(fiscalYearFromDate(new Date(2026, 0, 15))).toBe("2025-26");
	});

	it("generates descending options from current year", () => {
		const opts = fiscalYearOptions(3);
		expect(opts).toHaveLength(3);
		expect(opts[0]).toBe(currentFiscalYear());
	});
});
