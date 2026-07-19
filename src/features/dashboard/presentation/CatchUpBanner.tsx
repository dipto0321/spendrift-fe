import { Link } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { daysSinceEntry } from "@/features/expenses/domain/services";

export const NUDGE_AFTER_DAYS = 2;

type CatchUpBannerProps = {
	// undefined = still loading; null = tracker has no expenses yet.
	lastEntryDate: string | null | undefined;
};

// Ambient logging recency: a muted one-liner while caught up, a calm
// primary-tinted nudge once NUDGE_AFTER_DAYS days have passed. Renders
// nothing for empty trackers — nudging a brand-new tracker is just noise.
export function CatchUpBanner({ lastEntryDate }: Readonly<CatchUpBannerProps>) {
	if (!lastEntryDate) return null;

	const today = new Date().toISOString().split("T")[0];
	const days = daysSinceEntry(lastEntryDate, today);

	if (days < NUDGE_AFTER_DAYS) {
		return (
			<p className="text-xs text-muted-foreground">
				Last entry: {days === 0 ? "today" : "yesterday"}
			</p>
		);
	}

	const formatted = new Date(`${lastEntryDate}T00:00:00`).toLocaleDateString(
		undefined,
		{ month: "short", day: "numeric" },
	);

	return (
		<div className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
			<div className="flex items-center gap-2 text-sm">
				<CalendarClock className="size-4 text-primary" />
				<span>
					Last entry {formatted}
					<span className="text-muted-foreground"> — {days} days ago</span>
				</span>
			</div>
			<Button asChild size="sm">
				<Link to="/expenses" search={{ bulk: 1 }}>
					Catch up
				</Link>
			</Button>
		</div>
	);
}
