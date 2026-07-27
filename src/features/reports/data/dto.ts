import type { NeedsWantsSplit } from "@/features/expenses/domain/types";
import type {
	AnalyticsResult,
	CategoryBreakdown,
	CategoryWithDelta,
	LargestExpense,
	MonthlyInsightsSnapshot,
	PeriodData,
	YearComparison,
} from "../domain/types";

// API wire shapes (snake_case). Money is a Decimal string; converted to
// `number` at this boundary. The server computes every report, so these map
// straight onto the existing domain types that the charts already consume.

export type AnalyticsSummaryDto = {
	total: string;
	min: string;
	max: string;
	avg: string;
	count: number;
};

export type PeriodSpendDto = {
	label: string;
	total: string;
	count: number;
};

export type CategoryBreakdownItemDto = {
	category_id: string;
	category_name: string;
	category_color: string;
	total: string;
	percentage: number;
	count: number;
};

export type NeedsWantsSplitDto = {
	needs_total: string;
	wants_total: string;
	needs_percentage: number;
	wants_percentage: number;
};

export type YearComparisonItemDto = {
	year: number;
	total: string;
	avg: string;
	count: number;
};

export function mapAnalytics(dto: AnalyticsSummaryDto): AnalyticsResult {
	return {
		total: Number(dto.total),
		min: Number(dto.min),
		max: Number(dto.max),
		avg: Number(dto.avg),
		count: dto.count,
	};
}

export function mapPeriodSpend(dto: PeriodSpendDto): PeriodData {
	return {
		label: dto.label,
		total: Number(dto.total),
		count: dto.count,
	};
}

export function mapCategoryBreakdown(
	dto: CategoryBreakdownItemDto,
): CategoryBreakdown {
	return {
		categoryId: dto.category_id,
		categoryName: dto.category_name,
		categoryColor: dto.category_color,
		total: Number(dto.total),
		percentage: dto.percentage,
		count: dto.count,
	};
}

export function mapNeedsWants(dto: NeedsWantsSplitDto): NeedsWantsSplit {
	return {
		needs: Number(dto.needs_total),
		wants: Number(dto.wants_total),
		percentage: {
			needs: dto.needs_percentage,
			wants: dto.wants_percentage,
		},
	};
}

export function mapYearComparison(dto: YearComparisonItemDto): YearComparison {
	return {
		year: String(dto.year),
		total: Number(dto.total),
		avg: Number(dto.avg),
		count: dto.count,
	};
}

// Monthly insights snapshot — separate DTO shape because the endpoint is
// POST and the response nests a needs_wants object rather than a flat split.

export type CategoryWithDeltaDto = {
	category_id: string;
	category_name: string;
	category_color: string;
	current_total: string;
	prior_total: string;
	delta_pct: number;
	count: number;
};

export type LargestExpenseDto = {
	id: string;
	amount: string;
	date: string;
	description: string | null;
	category_name: string;
	type: "need" | "want";
};

export type MonthlyInsightsRequestBody = {
	month: string; // YYYY-MM
	top_n_categories?: number;
	top_n_expenses?: number;
};

export type MonthlyInsightsSnapshotDto = {
	tracker_id: string;
	month: string;
	currency: string;
	total: string;
	prior_total: string;
	delta_pct: number;
	top_categories: CategoryWithDeltaDto[];
	needs_wants: NeedsWantsSplitDto;
	largest_expenses: LargestExpenseDto[];
};

function mapCategoryWithDelta(dto: CategoryWithDeltaDto): CategoryWithDelta {
	return {
		categoryId: dto.category_id,
		categoryName: dto.category_name,
		categoryColor: dto.category_color,
		currentTotal: Number(dto.current_total),
		priorTotal: Number(dto.prior_total),
		deltaPct: dto.delta_pct,
		count: dto.count,
	};
}

function mapLargestExpense(dto: LargestExpenseDto): LargestExpense {
	return {
		id: dto.id,
		amount: Number(dto.amount),
		date: dto.date,
		description: dto.description,
		categoryName: dto.category_name,
		type: dto.type,
	};
}

export function mapMonthlyInsightsSnapshot(
	dto: MonthlyInsightsSnapshotDto,
): MonthlyInsightsSnapshot {
	return {
		trackerId: dto.tracker_id,
		month: dto.month,
		currency: dto.currency,
		total: Number(dto.total),
		priorTotal: Number(dto.prior_total),
		deltaPct: dto.delta_pct,
		topCategories: dto.top_categories.map(mapCategoryWithDelta),
		needsWants: mapNeedsWants(dto.needs_wants),
		largestExpenses: dto.largest_expenses.map(mapLargestExpense),
	};
}
