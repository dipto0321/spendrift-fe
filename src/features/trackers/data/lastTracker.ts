const LAST_TRACKER_STORAGE_KEY = "spendrift.last-tracker";

function isBrowser() {
	return globalThis.window !== undefined;
}

export function getLastTrackerId(): string | null {
	if (!isBrowser()) {
		return null;
	}
	return globalThis.window.localStorage.getItem(LAST_TRACKER_STORAGE_KEY);
}

export function setLastTrackerId(id: string) {
	if (!isBrowser()) {
		return;
	}
	globalThis.window.localStorage.setItem(LAST_TRACKER_STORAGE_KEY, id);
}
