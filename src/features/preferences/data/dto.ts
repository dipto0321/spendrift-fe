import type { Preferences, PreferencesPatch } from "../domain/types";

// API wire shape (snake_case, no booleans need money-style conversion).
export type PreferencesResponseDto = {
	id: string;
	user_id: string;
	budget_alerts_enabled: boolean;
	weekly_summary_enabled: boolean;
	round_amounts_enabled: boolean;
	created_at: string;
	updated_at: string;
};

export function mapPreferences(dto: PreferencesResponseDto): Preferences {
	return {
		budgetAlerts: dto.budget_alerts_enabled,
		weeklySummary: dto.weekly_summary_enabled,
		roundAmounts: dto.round_amounts_enabled,
	};
}

export function toPreferencesBody(
	patch: PreferencesPatch,
): Record<string, unknown> {
	const body: Record<string, unknown> = {};
	if (patch.budgetAlerts !== undefined) {
		body.budget_alerts_enabled = patch.budgetAlerts;
	}
	if (patch.weeklySummary !== undefined) {
		body.weekly_summary_enabled = patch.weeklySummary;
	}
	if (patch.roundAmounts !== undefined) {
		body.round_amounts_enabled = patch.roundAmounts;
	}
	return body;
}
