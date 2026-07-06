import { Check, ChevronsUpDown, Wallet } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useTracker } from "./TrackerContext";

export function TrackerSwitcher() {
	const { trackers, activeTracker, setActiveTrackerById } = useTracker();

	if (!activeTracker) return null;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="flex w-full items-center gap-2.5 rounded-lg border border-sidebar-border bg-sidebar p-2 text-left outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring"
				>
					<span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
						<Wallet className="size-4" />
					</span>
					<span className="flex min-w-0 flex-1 flex-col">
						<span className="truncate text-sm font-medium text-sidebar-foreground">
							{activeTracker.name}
						</span>
						<span className="truncate text-xs text-muted-foreground">
							{activeTracker.currency}
						</span>
					</span>
					<ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-56">
				<DropdownMenuGroup>
					<DropdownMenuLabel>Trackers</DropdownMenuLabel>
					{trackers.map((tracker) => (
						<DropdownMenuItem
							key={tracker.id}
							onClick={() => setActiveTrackerById(tracker.id)}
						>
							<span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-secondary-foreground">
								{tracker.currency.slice(0, 1)}
							</span>
							<span className="flex flex-1 flex-col">
								<span className="text-sm font-medium">{tracker.name}</span>
								<span className="text-xs text-muted-foreground">
									{tracker.currency}
								</span>
							</span>
							<Check
								className={cn(
									"size-4 text-primary",
									tracker.id === activeTracker.id
										? "opacity-100"
										: "opacity-0",
								)}
							/>
						</DropdownMenuItem>
					))}
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem asChild>
						<a href="/settings">Manage trackers</a>
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
