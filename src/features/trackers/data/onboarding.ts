const TRACKER_ONBOARDING_STORAGE_KEY = "fintrack.tracker-onboarded";
const TRACKER_ONBOARDING_EVENT = "fintrack:tracker-onboarding-changed";

function isBrowser() {
	return globalThis.window !== undefined;
}

export function getTrackerOnboardingStatus(): boolean {
	if (!isBrowser()) {
		return false;
	}

	return (
		globalThis.window.localStorage.getItem(TRACKER_ONBOARDING_STORAGE_KEY) ===
		"true"
	);
}

export function markTrackerOnboardingComplete() {
	if (!isBrowser()) {
		return;
	}

	globalThis.window.localStorage.setItem(
		TRACKER_ONBOARDING_STORAGE_KEY,
		"true",
	);
	globalThis.window.dispatchEvent(new Event(TRACKER_ONBOARDING_EVENT));
}

export function subscribeTrackerOnboardingStatusChange(
	onStoreChange: () => void,
) {
	if (!isBrowser()) {
		return () => {};
	}

	const handleStorageChange = (event: StorageEvent) => {
		if (event.key === TRACKER_ONBOARDING_STORAGE_KEY) {
			onStoreChange();
		}
	};

	globalThis.window.addEventListener("storage", handleStorageChange);
	globalThis.window.addEventListener(TRACKER_ONBOARDING_EVENT, onStoreChange);

	return () => {
		globalThis.window.removeEventListener("storage", handleStorageChange);
		globalThis.window.removeEventListener(
			TRACKER_ONBOARDING_EVENT,
			onStoreChange,
		);
	};
}
