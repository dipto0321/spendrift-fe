import type { ReactNode } from "react";

type PageHeaderProps = {
	kicker: string;
	title: string;
	description: string;
	actions?: ReactNode;
};

export function PageHeader({
	kicker,
	title,
	description,
	actions,
}: PageHeaderProps) {
	return (
		<header className="mb-6 flex items-end justify-between gap-4">
			<div className="min-w-0">
				<p className="island-kicker mb-2">{kicker}</p>
				<h1 className="display-title m-0 text-3xl font-semibold text-foreground sm:text-5xl">
					{title}
				</h1>
				<p className="m-0 mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
					{description}
				</p>
			</div>
			{actions && <div className="shrink-0">{actions}</div>}
		</header>
	);
}
