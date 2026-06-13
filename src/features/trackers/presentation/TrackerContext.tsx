import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
} from "react";
import { getLastTrackerId, setLastTrackerId } from "../data/lastTracker";
import { trackerRepository } from "../data/repository";
import type { Tracker } from "../domain/types";

type TrackerContextValue = {
	trackers: Tracker[];
	hasTrackers: boolean;
	isLoading: boolean;
	activeTracker: Tracker | null;
	setActiveTrackerById: (id: string) => void;
};

const TrackerContext = createContext<TrackerContextValue | null>(null);

// The active tracker is carried in the URL as ?tracker=<id>. Resolve it from
// the search param, falling back to the last-used tracker, then the first one.
function resolveActiveTracker(
	trackers: Tracker[],
	searchTrackerId: string | undefined,
): Tracker | null {
	const bySearch = trackers.find((t) => t.id === searchTrackerId);
	if (bySearch) return bySearch;

	const byStored = trackers.find((t) => t.id === getLastTrackerId());
	return byStored ?? trackers[0] ?? null;
}

export function TrackerProvider({
	children,
}: Readonly<{ children: ReactNode }>) {
	const navigate = useNavigate();
	const search = useSearch({ strict: false }) as { tracker?: string };
	const searchTrackerId = search.tracker;

	const { data: trackers = [], isLoading } = useQuery({
		queryKey: ["trackers"],
		queryFn: () => trackerRepository.getAll(),
	});

	const activeTracker = useMemo(
		() => resolveActiveTracker(trackers, searchTrackerId),
		[trackers, searchTrackerId],
	);

	// Keep ?tracker= canonical: once a tracker resolves, remember it and, if the
	// URL is missing or has a stale/invalid id, replace it with the real one.
	useEffect(() => {
		if (!activeTracker) return;
		setLastTrackerId(activeTracker.id);
		if (searchTrackerId !== activeTracker.id) {
			// `to: "."` keeps the current route and only rewrites its search, so
			// normalizing ?tracker= never changes which page you're on.
			navigate({
				to: ".",
				search: (prev) => ({ ...prev, tracker: activeTracker.id }),
				replace: true,
			});
		}
	}, [activeTracker, searchTrackerId, navigate]);

	const setActiveTrackerById = useCallback(
		(id: string) => {
			setLastTrackerId(id);
			navigate({ to: ".", search: (prev) => ({ ...prev, tracker: id }) });
		},
		[navigate],
	);

	const value = useMemo(
		() => ({
			trackers,
			hasTrackers: trackers.length > 0,
			isLoading,
			activeTracker,
			setActiveTrackerById,
		}),
		[trackers, isLoading, activeTracker, setActiveTrackerById],
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
