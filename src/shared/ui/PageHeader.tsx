import type { ReactNode } from "react";

interface PageHeaderProps {
	readonly title: string;
	readonly description?: string;
	readonly kicker?: string;
	readonly actions?: ReactNode;
}

export function PageHeader({
	kicker,
	title,
	description,
	actions,
}: PageHeaderProps) {
	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div className="min-w-0 flex flex-col gap-1">
				{kicker && <p className="island-kicker mb-0">{kicker}</p>}
				<h1 className="display-title m-0 text-2xl font-semibold tracking-tight text-balance text-foreground sm:text-3xl">
					{title}
				</h1>
				{description ? (
					<p className="m-0 text-sm text-pretty text-muted-foreground">
						{description}
					</p>
				) : null}
			</div>
			{actions && (
				<div className="flex shrink-0 items-center gap-2">{actions}</div>
			)}
		</div>
	);
}
