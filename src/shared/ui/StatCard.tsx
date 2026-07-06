import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export interface StatCardProps {
	readonly label: string;
	readonly value: React.ReactNode;
	readonly icon: LucideIcon;
	readonly hint?: React.ReactNode;
	readonly tone?: "default" | "success" | "destructive" | "warning";
}

const TONE: Record<NonNullable<StatCardProps["tone"]>, string> = {
	default: "bg-secondary text-foreground",
	success: "bg-success/15 text-success",
	destructive: "bg-destructive/15 text-destructive",
	warning: "bg-warning/15 text-warning-foreground dark:text-warning",
};

export function StatCard({
	label,
	value,
	icon: Icon,
	hint,
	tone = "default",
}: StatCardProps) {
	return (
		<Card>
			<CardContent className="flex flex-col gap-4">
				<div className="flex items-center justify-between">
					<span className="text-sm font-medium text-muted-foreground">
						{label}
					</span>
					<span
						className={cn(
							"flex size-8 items-center justify-center rounded-lg",
							TONE[tone],
						)}
					>
						<Icon className="size-4" />
					</span>
				</div>
				<div className="flex flex-col gap-1">
					<div className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
						{value}
					</div>
					{hint ? (
						<div className="text-xs text-muted-foreground">{hint}</div>
					) : null}
				</div>
			</CardContent>
		</Card>
	);
}

export function StatCardSkeleton() {
	return (
		<Card>
			<CardContent className="flex flex-col gap-4">
				<div className="flex items-center justify-between">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="size-8 rounded-lg" />
				</div>
				<div className="flex flex-col gap-2">
					<Skeleton className="h-7 w-32" />
					<Skeleton className="h-3 w-20" />
				</div>
			</CardContent>
		</Card>
	);
}
