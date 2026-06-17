import { ApiError, apiFetch } from "@/shared/api/client";
import type { TrackerRepository } from "../domain/repository";
import { mapTracker, type TrackerResponseDto } from "./dto";

export const trackerRepository: TrackerRepository = {
	async getAll() {
		const dtos = await apiFetch<TrackerResponseDto[]>("/trackers");
		return dtos.map(mapTracker);
	},

	async getById(id) {
		try {
			const dto = await apiFetch<TrackerResponseDto>(`/trackers/${id}`);
			return mapTracker(dto);
		} catch (error) {
			if (error instanceof ApiError && error.status === 404) return null;
			throw error;
		}
	},

	async create(name, currency) {
		const dto = await apiFetch<TrackerResponseDto>("/trackers", {
			method: "POST",
			body: { name, currency },
		});
		return mapTracker(dto);
	},

	async update(id, patch) {
		const dto = await apiFetch<TrackerResponseDto>(`/trackers/${id}`, {
			method: "PATCH",
			body: patch,
		});
		return mapTracker(dto);
	},

	async delete(id) {
		// The UI prevents deleting the last tracker; a successful 204 means done.
		await apiFetch<void>(`/trackers/${id}`, { method: "DELETE" });
		return true;
	},
};
