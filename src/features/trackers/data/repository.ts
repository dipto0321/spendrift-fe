import type { TrackerRepository } from "../domain/repository";
import type { Tracker } from "../domain/types";

const delay = (ms: number) =>
	new Promise<void>((resolve) => setTimeout(resolve, ms));

// MOCK-PHASE CRUTCH — remove when the real API lands. Trackers are the one
// piece of mock state that must survive a refresh: the workspace gate decides
// "onboard vs. dashboard" purely on whether any tracker exists, so losing them
// on reload would bounce the user back to onboarding. With a real backend the
// API is the source of truth and React Query refetches, so this goes away.
const STORAGE_KEY = "spendrift.trackers";

function isBrowser() {
	return globalThis.window !== undefined;
}

function loadTrackers(): Tracker[] {
	if (!isBrowser()) return [];
	const raw = globalThis.window.localStorage.getItem(STORAGE_KEY);
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw) as Tracker[];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function cloneTrackers(source: Tracker[]) {
	return source.map((tracker) => ({ ...tracker }));
}

let trackers: Tracker[] = loadTrackers();

function persist() {
	if (!isBrowser()) return;
	globalThis.window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trackers));
}

export function resetTrackerMockData() {
	trackers = [];
	persist();
}

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
		persist();
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
		persist();
		return { ...updated };
	},

	async delete(id: string): Promise<boolean> {
		await delay(140);
		if (trackers.length <= 1) return false;
		const before = trackers.length;
		trackers = trackers.filter((tracker) => tracker.id !== id);
		persist();
		return trackers.length < before;
	},
};
