import { useQuery } from "@tanstack/react-query";
import { type ReportRange, reportKeys } from "../data/queryKeys";
import { reportRepository } from "../data/repository";
import type { ReportPeriod } from "../domain/types";

// Query hooks for the reports feature. Every report is server-computed and
// tracker-scoped; the page stays thin and just feeds the active range/period.
// (useReportSummary was removed — the analytics stat cards now derive
// total/min/max/avg from the same per-bucket series as the spending chart,
// via `analyticsFromBuckets`, so they can't drift out of sync.)

export function useSpending(
	trackerId: string | undefined,
	period: ReportPeriod,
	range: ReportRange,
) {
	return useQuery({
		queryKey: reportKeys.spending(trackerId as string, period, range),
		queryFn: () =>
			reportRepository.getSpending(trackerId as string, period, range),
		enabled: Boolean(trackerId),
	});
}

export function useCategoryBreakdown(
	trackerId: string | undefined,
	range: ReportRange,
) {
	return useQuery({
		queryKey: reportKeys.categoryBreakdown(trackerId as string, range),
		queryFn: () =>
			reportRepository.getCategoryBreakdown(trackerId as string, range),
		enabled: Boolean(trackerId),
	});
}

export function useReportNeedsWants(
	trackerId: string | undefined,
	range: ReportRange,
) {
	return useQuery({
		queryKey: reportKeys.needsWants(trackerId as string, range),
		queryFn: () => reportRepository.getNeedsWants(trackerId as string, range),
		enabled: Boolean(trackerId),
	});
}

export function useYearComparison(trackerId: string | undefined) {
	return useQuery({
		queryKey: reportKeys.yearComparison(trackerId as string),
		queryFn: () => reportRepository.getYearComparison(trackerId as string),
		enabled: Boolean(trackerId),
	});
}
