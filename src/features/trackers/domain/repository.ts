import type { Tracker } from "./types";

export interface TrackerRepository {
	getAll(): Promise<Tracker[]>;
	getById(id: string): Promise<Tracker | null>;
	create(name: string, currency: string): Promise<Tracker>;
	update(
		id: string,
		patch: { name?: string; currency?: string },
	): Promise<Tracker | null>;
	delete(id: string): Promise<boolean>;
}
