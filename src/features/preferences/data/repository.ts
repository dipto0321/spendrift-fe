import { apiFetch } from "@/shared/api/client";
import type { PreferencesRepository } from "../domain/repository";
import {
	mapPreferences,
	type PreferencesResponseDto,
	toPreferencesBody,
} from "./dto";

export const preferencesRepository: PreferencesRepository = {
	async get() {
		const dto = await apiFetch<PreferencesResponseDto>("/preferences");
		return mapPreferences(dto);
	},

	async update(patch) {
		const dto = await apiFetch<PreferencesResponseDto>("/preferences", {
			method: "PUT",
			body: toPreferencesBody(patch),
		});
		return mapPreferences(dto);
	},
};
