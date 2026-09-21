import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/shared/api/client";
import { taxKeys } from "../data/queryKeys";
import { taxRepository } from "../data/repository";
import type { TaxHeadCode } from "../domain/types";

export function useTaxReportList(trackerId: string | undefined) {
	return useQuery({
		queryKey: taxKeys.list(trackerId as string),
		queryFn: () => taxRepository.list(trackerId as string),
		enabled: Boolean(trackerId),
	});
}

export function useTaxReport(
	trackerId: string | undefined,
	fiscalYear: string | undefined,
) {
	return useQuery({
		queryKey: taxKeys.detail(trackerId as string, fiscalYear as string),
		queryFn: () => taxRepository.get(trackerId as string, fiscalYear as string),
		enabled: Boolean(trackerId) && Boolean(fiscalYear),
		retry: (count, err) => {
			if (err instanceof ApiError && err.status === 404) return false;
			return count < 2;
		},
	});
}

export function useCreateTaxReport(trackerId: string | undefined) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (fiscalYear: string) =>
			taxRepository.createOrGet(trackerId as string, fiscalYear),
		onSuccess: (report) => {
			qc.invalidateQueries({ queryKey: taxKeys.all(trackerId as string) });
			qc.setQueryData(
				taxKeys.detail(trackerId as string, report.fiscalYear),
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

export function useUpdateTaxReport(trackerId: string | undefined) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			fiscalYear,
			heads,
		}: {
			fiscalYear: string;
			heads: { headCode: TaxHeadCode; amount: number }[];
		}) => taxRepository.updateHeads(trackerId as string, fiscalYear, heads),
		onSuccess: (report) => {
			qc.invalidateQueries({ queryKey: taxKeys.all(trackerId as string) });
			qc.setQueryData(
				taxKeys.detail(trackerId as string, report.fiscalYear),
				report,
			);
			toast.success("Heads updated");
		},
		onError: () => toast.error("Could not update heads"),
	});
}

export function useRegenerateTaxReport(trackerId: string | undefined) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (fiscalYear: string) =>
			taxRepository.regenerate(trackerId as string, fiscalYear),
		onSuccess: (report) => {
			qc.invalidateQueries({ queryKey: taxKeys.all(trackerId as string) });
			qc.setQueryData(
				taxKeys.detail(trackerId as string, report.fiscalYear),
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
