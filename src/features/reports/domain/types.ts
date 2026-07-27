export type ReportPeriod = "daily" | "weekly" | "monthly" | "yearly";

export type AnalyticsResult = {
	total: number;
	min: number;
	max: number;
	avg: number;
	count: number;
};

export type CategoryBreakdown = {
	categoryId: string;
	categoryName: string;
	categoryColor: string;
	total: number;
	percentage: number;
	count: number;
};

export type PeriodData = {
	label: string;
	total: number;
	count: number;
};

export type YearComparison = {
	year: string;
	total: number;
	avg: number;
	count: number;
};

// Snapshot of a single calendar month used by the Smart Report feature. The
// backend runs the aggregation; the frontend only narrates the numbers.
export type CategoryWithDelta = {
	categoryId: string;
	categoryName: string;
	categoryColor: string;
	currentTotal: number;
	priorTotal: number;
	deltaPct: number;
	count: number;
};

export type LargestExpense = {
	id: string;
	amount: number;
	date: string;
	description: string | null;
	categoryName: string;
	type: "need" | "want";
};

export type MonthlyInsightsSnapshot = {
	trackerId: string;
	month: string; // YYYY-MM
	currency: string;
	total: number;
	priorTotal: number;
	deltaPct: number;
	topCategories: CategoryWithDelta[];
	needsWants: import("@/features/expenses/domain/types").NeedsWantsSplit;
	largestExpenses: LargestExpense[];
};

// Source of the structured LLM narrative. The frontend constructs this from
// the snapshot and the LLM only writes the prose.
export type SmartReportNarrative = {
	whereItWent: string;
	whatChanged: string;
	whereToSave: string[];
};
