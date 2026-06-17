import { Card, CardContent } from "@/components/ui/card";

type StatCardProps = {
	label: string;
	value: string;
	subtext?: string;
};

export function StatCard({ label, value, subtext }: StatCardProps) {
	// Composes the shadcn Card primitive instead of the legacy `island-shell`
	// CSS. `gap-0` + `p-5` / `px-0` keep the original compact spacing; `lift` is
	// the shared hover-raise utility.
	return (
		<Card className="lift gap-0 rounded-2xl p-5">
			<CardContent className="px-0">
				<p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					{label}
				</p>
				<p className="m-0 mt-2 text-2xl font-semibold tabular-nums text-foreground">
					{value}
				</p>
				{subtext && (
					<p className="m-0 mt-1 text-xs text-muted-foreground">{subtext}</p>
				)}
			</CardContent>
		</Card>
	);
}
