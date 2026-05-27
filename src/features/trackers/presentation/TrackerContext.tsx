import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { trackerRepository } from "../data/repository";
import type { Tracker } from "../domain/types";

type TrackerContextValue = {
	trackers: Tracker[];
	hasTrackers: boolean;
	activeTracker: Tracker | null;
	setActiveTrackerById: (id: string) => void;
};

const TrackerContext = createContext<TrackerContextValue | null>(null);

export function TrackerProvider({
	children,
}: Readonly<{ children: ReactNode }>) {
	const { data: trackers = [] } = useQuery({
		queryKey: ["trackers"],
		queryFn: () => trackerRepository.getAll(),
	});
	const [activeTrackerId, setActiveTrackerId] = useState<string | null>(null);

	useEffect(() => {
		if (trackers.length === 0) {
			setActiveTrackerId(null);
			return;
		}

		const activeExists = trackers.some(
			(tracker) => tracker.id === activeTrackerId,
		);
		if (!activeTrackerId || !activeExists) {
			setActiveTrackerId(trackers[0].id);
		}
	}, [activeTrackerId, trackers]);

	const activeTracker = trackers.find((t) => t.id === activeTrackerId) ?? null;

	const setActiveTrackerById = useCallback((id: string) => {
		setActiveTrackerId(id);
	}, []);

	const value = useMemo(
		() => ({
			trackers,
			hasTrackers: trackers.length > 0,
			activeTracker,
			setActiveTrackerById,
		}),
		[activeTracker, setActiveTrackerById, trackers],
	);

	return (
		<TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>
	);
}

export function useTracker(): TrackerContextValue {
	const ctx = useContext(TrackerContext);
	if (!ctx) {
		throw new Error("useTracker must be used within a TrackerProvider");
	}
	return ctx;
}
