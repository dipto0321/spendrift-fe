import type {
	TaxHead,
	TaxHeadCode,
	TaxReport,
	TaxReportSummary,
} from "../domain/types";

// Wire shapes are snake_case with Decimal strings; domain uses camelCase + number.

export type TaxCategoryAllocationDto = {
	category_name: string;
	amount: string;
};

export type TaxHeadDto = {
	head_code: string;
	head_name: string;
	description: string;
	amount: string;
	category_allocations: TaxCategoryAllocationDto[];
};

export type TaxReportResponseDto = {
	id: string;
	tracker_id: string;
	fiscal_year: string;
	start_date: string;
	end_date: string;
	currency: string;
	total_amount: string;
	heads: TaxHeadDto[];
	created_at: string;
	updated_at: string;
};

export type TaxReportSummaryDto = {
	id: string;
	fiscal_year: string;
	start_date: string;
	end_date: string;
	total_amount: string;
	created_at: string;
};

export function mapTaxHead(dto: TaxHeadDto): TaxHead {
	return {
		headCode: dto.head_code as TaxHeadCode,
		headName: dto.head_name,
		description: dto.description,
		amount: Number(dto.amount),
		categoryAllocations: dto.category_allocations.map((a) => ({
			categoryName: a.category_name,
			amount: Number(a.amount),
		})),
	};
}

export function mapTaxReport(dto: TaxReportResponseDto): TaxReport {
	return {
		id: dto.id,
		trackerId: dto.tracker_id,
		fiscalYear: dto.fiscal_year,
		startDate: dto.start_date,
		endDate: dto.end_date,
		currency: dto.currency,
		totalAmount: Number(dto.total_amount),
		heads: dto.heads.map(mapTaxHead),
		createdAt: dto.created_at,
		updatedAt: dto.updated_at,
	};
}

export function mapTaxReportSummary(
	dto: TaxReportSummaryDto,
): TaxReportSummary {
	return {
		id: dto.id,
		fiscalYear: dto.fiscal_year,
		startDate: dto.start_date,
		endDate: dto.end_date,
		totalAmount: Number(dto.total_amount),
		createdAt: dto.created_at,
	};
}

export function toCreateBody(fiscalYear: string): Record<string, unknown> {
	return { fiscal_year: fiscalYear };
}

export function toUpdateBody(
	heads: { headCode: TaxHeadCode; amount: number }[],
): Record<string, unknown> {
	return {
		heads: heads.map((h) => ({
			head_code: h.headCode,
			amount: String(h.amount),
		})),
	};
}
