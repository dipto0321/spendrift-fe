import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/shared/api/client";
import { taxReportKeys } from "../data/queryKeys";
import { taxReportRepository } from "../data/repository";
import type { TaxHeadCode } from "../domain/types";

export function useTaxReportList(trackerId: string | undefined) {
	return useQuery({
		queryKey: taxReportKeys.list(trackerId as string),
		queryFn: () => taxReportRepository.list(trackerId as string),
		enabled: Boolean(trackerId),
	});
}

export function useTaxReport(
	trackerId: string | undefined,
	fiscalYear: string | undefined,
) {
	return useQuery({
		queryKey: taxReportKeys.report(trackerId as string, fiscalYear as string),
		queryFn: () =>
			taxReportRepository.get(trackerId as string, fiscalYear as string),
		enabled: Boolean(trackerId) && Boolean(fiscalYear),
		retry: (count, err) => {
			if (err instanceof ApiError && err.status === 404) return false;
			return count < 2;
		},
	});
}

export function useGenerateTaxReport(trackerId: string | undefined) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (fiscalYear: string) =>
			taxReportRepository.getOrCreate(trackerId as string, fiscalYear),
		onSuccess: (report) => {
			qc.invalidateQueries({
				queryKey: taxReportKeys.report(trackerId as string, report.fiscalYear),
			});
			qc.invalidateQueries({
				queryKey: taxReportKeys.list(trackerId as string),
			});
			qc.setQueryData(
				taxReportKeys.report(trackerId as string, report.fiscalYear),
				report,
			);
			toast.success(`Tax report ${report.fiscalYear} ready`);
		},
		onError: (err: unknown) => {
			if (err instanceof ApiError) {
				if (err.status === 503) {
					toast.error("AI classification is not configured on the server");
					return;
				}
				if (err.status === 502) {
					toast.error("AI provider could not classify categories");
					return;
				}
				toast.error(err.message);
				return;
			}
			toast.error("Could not create tax report");
		},
	});
}

export function useUpdateTaxReportHeads(trackerId: string | undefined) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			fiscalYear,
			heads,
		}: {
			fiscalYear: string;
			heads: { headCode: TaxHeadCode; amount: number }[];
		}) =>
			taxReportRepository.updateHeads(trackerId as string, fiscalYear, heads),
		onMutate: async ({ fiscalYear, heads }) => {
			const key = taxReportKeys.report(trackerId as string, fiscalYear);
			await qc.cancelQueries({ queryKey: key });
			const previous = qc.getQueryData(key);
			qc.setQueryData(key, (old: typeof previous) => {
				if (!old || typeof old !== "object") return old;
				const report = old as {
					heads: { headCode: string; amount: number }[];
				};
				return {
					...report,
					heads: report.heads.map((h) => {
						const edit = heads.find((e) => e.headCode === h.headCode);
						return edit ? { ...h, amount: edit.amount } : h;
					}),
				};
			});
			return { previous };
		},
		onError: (_err, { fiscalYear }, context) => {
			if (context?.previous !== undefined) {
				qc.setQueryData(
					taxReportKeys.report(trackerId as string, fiscalYear),
					context.previous,
				);
			}
			toast.error("Could not update heads");
		},
		onSuccess: (report) => {
			qc.invalidateQueries({
				queryKey: taxReportKeys.report(trackerId as string, report.fiscalYear),
			});
			qc.invalidateQueries({
				queryKey: taxReportKeys.list(trackerId as string),
			});
			qc.setQueryData(
				taxReportKeys.report(trackerId as string, report.fiscalYear),
				report,
			);
			toast.success("Saved");
		},
	});
}

export function useRegenerateTaxReport(trackerId: string | undefined) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (fiscalYear: string) =>
			taxReportRepository.regenerate(trackerId as string, fiscalYear),
		onSuccess: (report) => {
			qc.invalidateQueries({
				queryKey: taxReportKeys.report(trackerId as string, report.fiscalYear),
			});
			qc.invalidateQueries({
				queryKey: taxReportKeys.list(trackerId as string),
			});
			qc.setQueryData(
				taxReportKeys.report(trackerId as string, report.fiscalYear),
				report,
			);
			toast.success(`Regenerated ${report.fiscalYear}`);
		},
		onError: (err: unknown) => {
			if (err instanceof ApiError && err.status === 503) {
				toast.error("AI classification is not configured");
				return;
			}
			toast.error("Could not regenerate report");
		},
	});
}
