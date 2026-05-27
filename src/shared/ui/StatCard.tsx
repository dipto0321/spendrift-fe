type StatCardProps = {
	label: string;
	value: string;
	subtext?: string;
};

export function StatCard({ label, value, subtext }: StatCardProps) {
	return (
		<section className="island-shell rounded-2xl p-5">
			<p className="m-0 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
				{label}
			</p>
			<p className="m-0 mt-2 text-2xl font-semibold text-foreground tabular-nums">
				{value}
			</p>
			{subtext && (
				<p className="m-0 mt-1 text-xs text-muted-foreground">{subtext}</p>
			)}
		</section>
	);
}
