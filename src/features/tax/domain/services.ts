import type { TaxHeadCode } from "./types";

// Canonical IT-10BB head order shared with the backend (TAX_HEADS).
export const TAX_HEAD_ORDER: TaxHeadCode[] = [
	"food_clothing_essentials",
	"accommodation",
	"auto_transportation",
	"household_utility",
	"education",
	"festival_special",
	"other_expenses",
	"personal_loan_interest",
	"environmental_surcharge",
];

export const TAX_HEAD_META: Record<
	TaxHeadCode,
	{ name: string; description: string }
> = {
	food_clothing_essentials: {
		name: "Food, Clothing & Other Essentials",
		description:
			"Daily food and meals, family clothing, and essential household/grocery purchases for the year.",
	},
	accommodation: {
		name: "Accommodation Expense",
		description:
			"House rent, or repair and maintenance of the residence (enter 0 for an owned home).",
	},
	auto_transportation: {
		name: "Auto & Transportation",
		description:
			"Fuel and maintenance for your own vehicle, or bus, train, rideshare and daily commuting costs.",
	},
	household_utility: {
		name: "Household & Utility",
		description:
			"Dish, internet, water, gas and electricity bills, plus wages for household help.",
	},
	education: {
		name: "Education Expenses",
		description:
			"Books, stationery, and tuition/school/college/university fees for yourself or family.",
	},
	festival_special: {
		name: "Festival & Special Expenses",
		description:
			"Religious festivals (Eid/Puja etc.), family travel/vacations, and gifts to close relatives.",
	},
	other_expenses: {
		name: "Any Other Expenses",
		description:
			"Other costs not listed above, such as doctor/medical expenses or life-insurance premiums.",
	},
	personal_loan_interest: {
		name: "Interest on Personal Loan",
		description:
			"Interest paid during the year on a personal loan (0 if none).",
	},
	environmental_surcharge: {
		name: "Environmental Surcharge",
		description: "Surcharge on multiple personal vehicles/assets (normally 0).",
	},
};

// Bangladesh income year: Jul 1 YYYY → Jun 30 YYYY+1, displayed as YYYY-YY.
const FISCAL_YEAR_RE = /^(\d{4})-(\d{2})$/;

export function isValidFiscalYear(fy: string): boolean {
	const m = FISCAL_YEAR_RE.exec(fy);
	if (!m) return false;
	const start = Number(m[1]);
	const end = Number(m[2]);
	return end === (start + 1) % 100;
}

export function fiscalYearBounds(fy: string): {
	startDate: string;
	endDate: string;
} {
	const startYear = Number(fy.slice(0, 4));
	return {
		startDate: `${startYear}-07-01`,
		endDate: `${startYear + 1}-06-30`,
	};
}

export function fiscalYearFromDate(d: Date): string {
	const y = d.getFullYear();
	const m = d.getMonth() + 1; // 1-indexed
	const startYear = m >= 7 ? y : y - 1;
	const endYY = String((startYear + 1) % 100).padStart(2, "0");
	return `${startYear}-${endYY}`;
}

export function currentFiscalYear(): string {
	return fiscalYearFromDate(new Date());
}

export function fiscalYearOptions(count = 7): string[] {
	const current = currentFiscalYear();
	const startYear = Number(current.slice(0, 4));
	const out: string[] = [];
	for (let i = 0; i < count; i++) {
		const y = startYear - i;
		const yy = String((y + 1) % 100).padStart(2, "0");
		out.push(`${y}-${yy}`);
	}
	return out;
}

export function fiscalYearLabel(fy: string): string {
	const { startDate, endDate } = fiscalYearBounds(fy);
	return `${fy} · ${startDate} → ${endDate}`;
}
