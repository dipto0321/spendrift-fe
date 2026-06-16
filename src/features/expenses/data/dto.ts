import type {
	Category,
	CategoryColor,
	Expense,
	ExpenseCreateInput,
	ExpenseFilter,
	ExpenseUpdateInput,
} from "../domain/types";

// API wire shapes (snake_case). Money is a Decimal serialized as a string; the
// domain uses `number`, so conversion happens here at the boundary.

export type CategoryResponseDto = {
	id: string;
	tracker_id: string;
	name: string;
	color: string;
	created_at: string;
	updated_at: string;
};

export type ExpenseResponseDto = {
	id: string;
	tracker_id: string;
	category_id: string;
	amount: string;
	date: string;
	description: string | null;
	type: Expense["type"];
	created_at: string;
	updated_at: string;
};

export const UNCATEGORIZED_NAME = "Uncategorized";

export function mapCategory(dto: CategoryResponseDto): Category {
	return {
		id: dto.id,
		trackerId: dto.tracker_id,
		name: dto.name,
		color: dto.color as CategoryColor,
		createdAt: dto.created_at,
	};
}

export function mapExpense(dto: ExpenseResponseDto): Expense {
	return {
		id: dto.id,
		trackerId: dto.tracker_id,
		amount: Number(dto.amount),
		categoryId: dto.category_id,
		date: dto.date,
		description: dto.description ?? undefined,
		type: dto.type,
	};
}

// Build the request body for create/update. Money goes back out as a string;
// only defined fields are included so PATCH stays partial.
export function toExpenseBody(
	input: ExpenseCreateInput | ExpenseUpdateInput,
): Record<string, unknown> {
	const body: Record<string, unknown> = {};
	if (input.amount !== undefined) body.amount = String(input.amount);
	if (input.categoryId !== undefined) body.category_id = input.categoryId;
	if (input.date !== undefined) body.date = input.date;
	if (input.type !== undefined) body.type = input.type;
	if ("description" in input) body.description = input.description ?? null;
	return body;
}

// Map the client ExpenseFilter to API query params. Note the API's `type` is a
// single value, so a multi-select that includes both need+want is treated as
// "no filter" (omitted).
export function toExpenseQuery(filter?: ExpenseFilter): string {
	if (!filter) return "";
	const params = new URLSearchParams();
	if (filter.dateRange?.start) params.set("start_date", filter.dateRange.start);
	if (filter.dateRange?.end) params.set("end_date", filter.dateRange.end);
	if (filter.categoryIds?.length) {
		params.set("category_ids", filter.categoryIds.join(","));
	}
	if (filter.types?.length === 1) params.set("type", filter.types[0]);
	if (filter.search) params.set("search", filter.search);
	const qs = params.toString();
	return qs ? `?${qs}` : "";
}
