import { ChevronsUpDown } from "lucide-react";
import { useTracker } from "./TrackerContext";

export function TrackerSelector() {
	const { trackers, activeTracker, setActiveTrackerById } = useTracker();

	return (
		<div className="px-3 pt-4">
			<div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5">
				<div className="flex items-center gap-2.5">
					<ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
					<select
						value={activeTracker.id}
						onChange={(e) => setActiveTrackerById(e.target.value)}
						className="flex-1 bg-transparent text-sm font-medium text-foreground outline-none cursor-pointer appearance-none"
					>
						{trackers.map((t) => (
							<option key={t.id} value={t.id}>
								{t.name} ({t.currency})
							</option>
						))}
					</select>
				</div>
				<p className="mt-1 ml-6 text-[10px] text-muted-foreground">
					Currency: {activeTracker.currency}
				</p>
			</div>
		</div>
	);
}
