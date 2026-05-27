import { Cell, Pie, PieChart } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";

type NeedsWantsPieProps = {
	needs: number;
	wants: number;
	needsPercentage: number;
	wantsPercentage: number;
	currency: string;
};

const chartConfig = {
	needs: {
		label: "Needs",
		color: "var(--chart-2)",
	},
	wants: {
		label: "Wants",
		color: "var(--chart-4)",
	},
} satisfies ChartConfig;

function formatAmount(value: number, currency: string): string {
	return new Intl.NumberFormat(undefined, {
		style: "currency",
		currency,
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

export function NeedsVsWantsPie({
	needs,
	wants,
	needsPercentage,
	wantsPercentage,
	currency,
}: NeedsVsWantsPieProps) {
	const total = needs + wants;

	if (total === 0) {
		return (
			<div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
				No data available
			</div>
		);
	}

	const data = [
		{ name: "needs", value: needs, fill: "var(--color-needs)" },
		{ name: "wants", value: wants, fill: "var(--color-wants)" },
	];

	return (
		<div>
			<ChartContainer config={chartConfig} className="h-[300px] w-full">
				<PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
					<Pie
						data={data}
						dataKey="value"
						nameKey="name"
						cx="50%"
						cy="50%"
						innerRadius={60}
						outerRadius={110}
						paddingAngle={4}
					>
						<Cell key="needs" fill="var(--color-needs)" />
						<Cell key="wants" fill="var(--color-wants)" />
					</Pie>
					<ChartTooltip
						content={
							<ChartTooltipContent
								formatter={(value, name) => {
									const pct =
										name === "needs" ? needsPercentage : wantsPercentage;
									return `${formatAmount(Number(value), currency)} (${pct}%)`;
								}}
							/>
						}
					/>
				</PieChart>
			</ChartContainer>
		</div>
	);
}
