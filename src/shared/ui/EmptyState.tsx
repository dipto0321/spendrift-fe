import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
	icon?: LucideIcon;
	title: string;
	description?: string;
	action?: React.ReactNode;
	className?: string;
}

export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-12 text-center",
				className,
			)}
		>
			{Icon ? (
				<div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
					<Icon className="size-5" />
				</div>
			) : null}
			<div className="flex flex-col gap-1">
				<p className="font-medium text-foreground">{title}</p>
				{description ? (
					<p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
						{description}
					</p>
				) : null}
			</div>
			{action ? <div className="mt-1">{action}</div> : null}
		</div>
	);
}
