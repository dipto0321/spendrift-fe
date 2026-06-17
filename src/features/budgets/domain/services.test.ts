import { describe, expect, it } from "vitest";
import type { Expense } from "@/features/expenses/domain/types";
import {
	calculateBudgetStatus,
	getCurrentMonth,
	getHealthLabel,
	getSavingsHealth,
} from "./services";

function expense(amount: number, type: Expense["type"] = "need"): Expense {
	return {
		id: crypto.randomUUID(),
		trackerId: "t1",
		amount,
		categoryId: "c1",
		date: "2026-01-10",
		type,
	};
}

describe("getSavingsHealth", () => {
	it("is yellow when there is no monthly limit", () => {
		expect(getSavingsHealth(0, 0, 0)).toBe("yellow");
	});

	it("is red when spending exceeds the limit", () => {
		expect(getSavingsHealth(1200, 1000, 200)).toBe("red");
	});

	it("is green when the remaining amount covers the savings target", () => {
		// spent 700 of 1000 → 300 remaining ≥ 300 target
		expect(getSavingsHealth(700, 1000, 300)).toBe("green");
	});

	it("is green when under 80% spent even if savings target is missed", () => {
		// 70% spent, remaining 300 < 400 target, but spentPercentage < 80
		expect(getSavingsHealth(700, 1000, 400)).toBe("green");
	});

	it("is yellow between 80% and 95% spent with the target missed", () => {
		expect(getSavingsHealth(850, 1000, 400)).toBe("yellow");
	});

	it("is red at or above 95% spent with the target missed", () => {
		expect(getSavingsHealth(960, 1000, 400)).toBe("red");
	});
});

describe("calculateBudgetStatus", () => {
	it("sums expenses and derives remaining/over-budget", () => {
		const status = calculateBudgetStatus(1000, 200, [
			expense(300),
			expense(250, "want"),
		]);
		expect(status.spent).toBe(550);
		expect(status.remaining).toBe(450);
		expect(status.isOverBudget).toBe(false);
	});

	it("flags over budget when spending passes the limit", () => {
		const status = calculateBudgetStatus(500, 100, [expense(600)]);
		expect(status.remaining).toBe(-100);
		expect(status.isOverBudget).toBe(true);
		expect(status.savingsHealth).toBe("red");
	});

	it("caps savings progress at 100%", () => {
		// remaining 1000, target 200 → 500% raw, capped to 100
		const status = calculateBudgetStatus(1000, 200, []);
		expect(status.savingsProgress).toBe(100);
	});

	it("returns zero savings progress when there is no monthly limit", () => {
		const status = calculateBudgetStatus(0, 200, [expense(50)]);
		expect(status.savingsProgress).toBe(0);
	});
});

describe("getHealthLabel", () => {
	it("maps each health to a human label", () => {
		expect(getHealthLabel("green")).toBe("On Track");
		expect(getHealthLabel("yellow")).toBe("Caution");
		expect(getHealthLabel("red")).toBe("Over Budget");
	});
});

describe("getCurrentMonth", () => {
	it("formats the current month as YYYY-MM", () => {
		expect(getCurrentMonth()).toMatch(/^\d{4}-\d{2}$/);
	});
});
