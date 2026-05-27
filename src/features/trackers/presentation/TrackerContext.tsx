import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { trackerRepository } from "../data/repository";
import { SEED_TRACKERS } from "../data/mock-data";
import type { Tracker } from "../domain/types";

type TrackerContextValue = {
	trackers: Tracker[];
	activeTracker: Tracker;
	setActiveTrackerById: (id: string) => void;
};

const TrackerContext = createContext<TrackerContextValue | null>(null);

export function TrackerProvider({ children }: { children: ReactNode }) {
	const { data: trackers = SEED_TRACKERS } = useQuery({
		queryKey: ["trackers"],
		queryFn: () => trackerRepository.getAll(),
	});
	const [activeTrackerId, setActiveTrackerId] = useState<string>(
		trackers[0]?.id ?? "",
	);

	useEffect(() => {
		if (trackers.length === 0) return;

		const activeExists = trackers.some((tracker) => tracker.id === activeTrackerId);
		if (!activeTrackerId || !activeExists) {
			setActiveTrackerId(trackers[0].id);
		}
	}, [activeTrackerId, trackers]);

	const activeTracker =
		trackers.find((t) => t.id === activeTrackerId) ?? trackers[0];

	const setActiveTrackerById = useCallback((id: string) => {
		setActiveTrackerId(id);
	}, []);

	return (
		<TrackerContext.Provider
			value={{
				trackers,
				activeTracker: activeTracker ?? trackers[0] ?? SEED_TRACKERS[0],
				setActiveTrackerById,
			}}
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
