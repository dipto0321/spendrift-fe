export type TaxHeadCode =
	| "food_clothing_essentials"
	| "accommodation"
	| "auto_transportation"
	| "household_utility"
	| "education"
	| "festival_special"
	| "other_expenses"
	| "personal_loan_interest"
	| "environmental_surcharge";

export type TaxCategoryAllocation = {
	categoryName: string;
	amount: number;
};

export type TaxHead = {
	headCode: TaxHeadCode;
	headName: string;
	description: string;
	amount: number;
	categoryAllocations: TaxCategoryAllocation[];
};

export type TaxReport = {
	id: string;
	trackerId: string;
	fiscalYear: string;
	startDate: string;
	endDate: string;
	currency: string;
	totalAmount: number;
	heads: TaxHead[];
	createdAt: string;
	updatedAt: string;
};

export type TaxReportSummary = {
	id: string;
	fiscalYear: string;
	startDate: string;
	endDate: string;
	totalAmount: number;
	createdAt: string;
};

export type TaxHeadUpdate = {
	headCode: TaxHeadCode;
	amount: number;
};
