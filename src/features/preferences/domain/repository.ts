import type { Preferences, PreferencesPatch } from "./types";

export interface PreferencesRepository {
	get(): Promise<Preferences>;
	update(patch: PreferencesPatch): Promise<Preferences>;
}
