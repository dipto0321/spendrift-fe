import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useTracker } from "./TrackerContext";

export function TrackerSelector() {
	const { trackers, activeTracker, setActiveTrackerById } = useTracker();
	const selectedTrackerId = activeTracker?.id ?? "";
	const selectedCurrency = activeTracker?.currency ?? "";

	return (
		<div className="px-3 pt-4">
			<Select value={selectedTrackerId} onValueChange={setActiveTrackerById}>
				<SelectTrigger
					className="w-full rounded-xl border-border/60 bg-muted/30"
					aria-label="Active tracker"
				>
					<SelectValue placeholder="Select a tracker" />
				</SelectTrigger>
				<SelectContent>
					{trackers.map((tracker) => (
						<SelectItem key={tracker.id} value={tracker.id}>
							{tracker.name} ({tracker.currency})
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<p className="mt-1 ml-1 text-[10px] text-muted-foreground">
				Currency: {selectedCurrency}
			</p>
		</div>
	);
}
