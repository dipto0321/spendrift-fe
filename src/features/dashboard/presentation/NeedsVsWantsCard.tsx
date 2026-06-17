import { Progress } from "@/components/ui/progress";
import type { NeedsWantsSplit } from "@/features/expenses/domain/types";
import { formatCurrency } from "@/shared/utils/format";

type NeedsVsWantsCardProps = {
	needsWants: NeedsWantsSplit | undefined;
	currency: string;
};

export function NeedsVsWantsCard({
	needsWants,
	currency,
}: NeedsVsWantsCardProps) {
	return (
		<section className="island-shell rounded-2xl p-6">
			<h2 className="island-kicker mb-4">Needs vs Wants</h2>
			<div className="space-y-3">
				<div>
					<div className="flex items-center justify-between text-sm">
						<span className="text-foreground">Needs</span>
						<span className="font-semibold tabular-nums text-foreground">
							{formatCurrency(needsWants?.needs ?? 0, currency)}
						</span>
					</div>
					<Progress
						value={needsWants?.percentage.needs ?? 0}
						className="mt-1 h-2 bg-muted"
						indicatorClassName="bg-green-500"
					/>
				</div>
				<div>
					<div className="flex items-center justify-between text-sm">
						<span className="text-foreground">Wants</span>
						<span className="font-semibold tabular-nums text-foreground">
							{formatCurrency(needsWants?.wants ?? 0, currency)}
						</span>
					</div>
					<Progress
						value={needsWants?.percentage.wants ?? 0}
						className="mt-1 h-2 bg-muted"
						indicatorClassName="bg-orange-500"
					/>
				</div>
			</div>
		</section>
	);
}
