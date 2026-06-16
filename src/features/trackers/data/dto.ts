import type { Tracker } from "../domain/types";

// API wire shape (snake_case). The domain only needs id/name/currency; the
// timestamps are carried for completeness but dropped in the mapper.
export type TrackerResponseDto = {
	id: string;
	name: string;
	currency: string;
	created_at: string;
	updated_at: string;
};

export function mapTracker(dto: TrackerResponseDto): Tracker {
	return {
		id: dto.id,
		name: dto.name,
		currency: dto.currency,
	};
}
