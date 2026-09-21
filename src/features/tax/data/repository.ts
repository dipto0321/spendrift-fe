import { apiFetch } from "@/shared/api/client";
import type { TaxHeadCode, TaxReport, TaxReportSummary } from "../domain/types";
import {
	mapTaxReport,
	mapTaxReportSummary,
	type TaxReportResponseDto,
	type TaxReportSummaryDto,
	toCreateBody,
	toUpdateBody,
} from "./dto";

function basePath(trackerId: string) {
	return `/trackers/${trackerId}/tax-reports`;
}

export const taxRepository = {
	async list(trackerId: string): Promise<TaxReportSummary[]> {
		const dtos = await apiFetch<TaxReportSummaryDto[]>(basePath(trackerId));
		return dtos.map(mapTaxReportSummary);
	},

	async get(trackerId: string, fiscalYear: string): Promise<TaxReport> {
		const dto = await apiFetch<TaxReportResponseDto>(
			`${basePath(trackerId)}/${fiscalYear}`,
		);
		return mapTaxReport(dto);
	},

	async createOrGet(trackerId: string, fiscalYear: string): Promise<TaxReport> {
		const dto = await apiFetch<TaxReportResponseDto>(basePath(trackerId), {
			method: "POST",
			body: toCreateBody(fiscalYear),
		});
		return mapTaxReport(dto);
	},

	async updateHeads(
		trackerId: string,
		fiscalYear: string,
		heads: { headCode: TaxHeadCode; amount: number }[],
	): Promise<TaxReport> {
		const dto = await apiFetch<TaxReportResponseDto>(
			`${basePath(trackerId)}/${fiscalYear}`,
			{ method: "PATCH", body: toUpdateBody(heads) },
		);
		return mapTaxReport(dto);
	},

	async regenerate(trackerId: string, fiscalYear: string): Promise<TaxReport> {
		const dto = await apiFetch<TaxReportResponseDto>(
			`${basePath(trackerId)}/${fiscalYear}/regenerate`,
			{ method: "POST" },
		);
		return mapTaxReport(dto);
	},
};
