import { Label, Pie, PieChart } from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";
import type { NeedsWantsSplit } from "@/features/expenses/domain/types";
import { getCurrencySymbol } from "@/shared/utils/currency";

const NEEDS_COLOR = "hsl(152 55% 52%)";
const WANTS_COLOR = "hsl(38 65% 52%)";

const chartConfig = {
	needs: { label: "Needs", color: NEEDS_COLOR },
	wants: { label: "Wants", color: WANTS_COLOR },
} satisfies ChartConfig;

function formatCompact(amount: number, currency: string): string {
	const symbol = getCurrencySymbol(currency);
	const compact = new Intl.NumberFormat("en", {
		notation: "compact",
		maximumFractionDigits: 1,
	}).format(amount);
	return `${symbol}${compact}`;
}

type DonutCenterLabelProps = {
	viewBox?: { cx?: number; cy?: number };
	compactTotal: string;
};

function DonutCenterLabel({ viewBox, compactTotal }: Readonly<DonutCenterLabelProps>) {
	if (!viewBox?.cx || !viewBox?.cy) return null;
	const { cx, cy } = viewBox;
	return (
		<text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
			<tspan x={cx} y={cy - 10} fontSize={20} fontWeight={600} fill="currentColor">
				{compactTotal}
			</tspan>
			<tspan x={cx} y={cy + 14} fontSize={13} fill="var(--muted-foreground)">
				Total
			</tspan>
		</text>
	);
}

type NeedsVsWantsCardProps = {
	readonly needsWants: NeedsWantsSplit | undefined;
	readonly currency: string;
};

export function NeedsVsWantsCard({
	needsWants,
	currency,
}: NeedsVsWantsCardProps) {
	const hasData =
		needsWants && (needsWants.needs > 0 || needsWants.wants > 0);
	const total = (needsWants?.needs ?? 0) + (needsWants?.wants ?? 0);
	const compactTotal = formatCompact(total, currency);

	const chartData = [
		{ name: "needs", value: needsWants?.needs ?? 0, fill: NEEDS_COLOR },
		{ name: "wants", value: needsWants?.wants ?? 0, fill: WANTS_COLOR },
	];

	return (
		<Card className="h-full">
			<CardHeader>
				<CardTitle>Needs vs Wants</CardTitle>
				<CardDescription>Spending split this month</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col items-center gap-6">
				{hasData ? (
					<>
						<ChartContainer config={chartConfig} className="h-[260px] w-full">
							<PieChart>
								<ChartTooltip
									content={
										<ChartTooltipContent
											nameKey="name"
											hideLabel
											formatter={(value, name) =>
												`${name === "needs" ? "Needs" : "Wants"}: ${formatCompact(value as number, currency)}`
											}
										/>
									}
								/>
								<Pie
									data={chartData}
									dataKey="value"
									nameKey="name"
									innerRadius="58%"
									outerRadius="82%"
									strokeWidth={0}
									paddingAngle={2}
								>
									<Label
										content={<DonutCenterLabel compactTotal={compactTotal} />}
									/>
								</Pie>
							</PieChart>
						</ChartContainer>

						<div className="flex w-full items-center justify-center gap-10">
							<div className="flex items-center gap-2">
								<span className="text-sm text-muted-foreground">Needs</span>
								<span className="text-sm font-semibold tabular-nums">
									{needsWants?.percentage.needs ?? 0}%
								</span>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-sm text-muted-foreground">Wants</span>
								<span className="text-sm font-semibold tabular-nums">
									{needsWants?.percentage.wants ?? 0}%
								</span>
							</div>
						</div>
					</>
				) : (
					<p className="py-10 text-sm text-muted-foreground">
						No expenses yet.
					</p>
				)}
			</CardContent>
		</Card>
	);
}
