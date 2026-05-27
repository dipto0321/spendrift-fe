import type { TrackerRepository } from "../domain/repository";
import type { Tracker } from "../domain/types";

const delay = (ms: number) =>
	new Promise<void>((resolve) => setTimeout(resolve, ms));

function cloneTrackers(source: Tracker[]) {
	return source.map((tracker) => ({ ...tracker }));
}

let trackers: Tracker[] = [];

export const trackerRepository: TrackerRepository = {
	async getAll(): Promise<Tracker[]> {
		await delay(120);
		return cloneTrackers(trackers);
	},

	async getById(id: string): Promise<Tracker | null> {
		await delay(80);
		const found = trackers.find((tracker) => tracker.id === id);
		return found ? { ...found } : null;
	},

	async create(name: string, currency: string): Promise<Tracker> {
		await delay(180);
		const tracker: Tracker = {
			id: crypto.randomUUID(),
			name,
			currency,
		};
		trackers = [...trackers, tracker];
		return { ...tracker };
	},

	async update(
		id: string,
		patch: { name?: string; currency?: string },
	): Promise<Tracker | null> {
		await delay(180);
		const index = trackers.findIndex((tracker) => tracker.id === id);
		if (index === -1) return null;
		const updated: Tracker = { ...trackers[index], ...patch };
		trackers = trackers.map((tracker) =>
			tracker.id === id ? updated : tracker,
		);
		return { ...updated };
	},

	async delete(id: string): Promise<boolean> {
		await delay(140);
		if (trackers.length <= 1) return false;
		const before = trackers.length;
		trackers = trackers.filter((tracker) => tracker.id !== id);
		return trackers.length < before;
	},
};
