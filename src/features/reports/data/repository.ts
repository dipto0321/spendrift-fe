import type { NeedsWantsSplit } from "@/features/expenses/domain/types";
import { apiFetch } from "@/shared/api/client";
import type {
	AnalyticsResult,
	CategoryBreakdown,
	PeriodData,
	ReportPeriod,
	YearComparison,
} from "../domain/types";
import {
	type AnalyticsSummaryDto,
	type CategoryBreakdownItemDto,
	mapAnalytics,
	mapCategoryBreakdown,
	mapNeedsWants,
	mapPeriodSpend,
	mapYearComparison,
	type NeedsWantsSplitDto,
	type PeriodSpendDto,
	type YearComparisonItemDto,
} from "./dto";
import type { ReportRange } from "./queryKeys";

// Builds a `?start_date=…&end_date=…` suffix, omitting absent ends so the
// server falls back to all-time.
function rangeQuery(range: ReportRange): string {
	const params = new URLSearchParams();
	if (range.startDate) params.set("start_date", range.startDate);
	if (range.endDate) params.set("end_date", range.endDate);
	const qs = params.toString();
	return qs ? `?${qs}` : "";
}

export const reportRepository = {
	async getSummary(
		trackerId: string,
		range: ReportRange,
	): Promise<AnalyticsResult> {
		const dto = await apiFetch<AnalyticsSummaryDto>(
			`/trackers/${trackerId}/reports/summary${rangeQuery(range)}`,
		);
		return mapAnalytics(dto);
	},

	async getSpending(
		trackerId: string,
		period: ReportPeriod,
		range: ReportRange,
	): Promise<PeriodData[]> {
		const params = new URLSearchParams({ period });
		if (range.startDate) params.set("start_date", range.startDate);
		if (range.endDate) params.set("end_date", range.endDate);
		const dtos = await apiFetch<PeriodSpendDto[]>(
			`/trackers/${trackerId}/reports/spending?${params.toString()}`,
		);
		return dtos.map(mapPeriodSpend);
	},

	async getCategoryBreakdown(
		trackerId: string,
		range: ReportRange,
	): Promise<CategoryBreakdown[]> {
		const dtos = await apiFetch<CategoryBreakdownItemDto[]>(
			`/trackers/${trackerId}/reports/category-breakdown${rangeQuery(range)}`,
		);
		return dtos.map(mapCategoryBreakdown);
	},

	async getNeedsWants(
		trackerId: string,
		range: ReportRange,
	): Promise<NeedsWantsSplit> {
		const dto = await apiFetch<NeedsWantsSplitDto>(
			`/trackers/${trackerId}/reports/needs-vs-wants${rangeQuery(range)}`,
		);
		return mapNeedsWants(dto);
	},

	async getYearComparison(trackerId: string): Promise<YearComparison[]> {
		const dtos = await apiFetch<YearComparisonItemDto[]>(
			`/trackers/${trackerId}/reports/year-comparison`,
		);
		return dtos.map(mapYearComparison);
	},
};
