import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useState } from "react";
import { SEED_TRACKERS } from "../data/mock-data";
import type { Tracker } from "../domain/types";

type TrackerContextValue = {
	trackers: Tracker[];
	activeTracker: Tracker;
	setActiveTrackerById: (id: string) => void;
};

const TrackerContext = createContext<TrackerContextValue | null>(null);

export function TrackerProvider({ children }: { children: ReactNode }) {
	const [trackers] = useState<Tracker[]>(SEED_TRACKERS);
	const [activeTrackerId, setActiveTrackerId] = useState<string>(
		trackers[0]?.id ?? "",
	);

	const activeTracker =
		trackers.find((t) => t.id === activeTrackerId) ?? trackers[0];

	const setActiveTrackerById = useCallback((id: string) => {
		setActiveTrackerId(id);
	}, []);

	return (
		<TrackerContext.Provider
			value={{ trackers, activeTracker, setActiveTrackerById }}
		>
			{children}
		</TrackerContext.Provider>
	);
}

export function useTracker(): TrackerContextValue {
	const ctx = useContext(TrackerContext);
	if (!ctx) {
		throw new Error("useTracker must be used within a TrackerProvider");
	}
	return ctx;
}
