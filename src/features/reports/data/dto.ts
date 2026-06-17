import type { NeedsWantsSplit } from "@/features/expenses/domain/types";
import type {
	AnalyticsResult,
	CategoryBreakdown,
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
