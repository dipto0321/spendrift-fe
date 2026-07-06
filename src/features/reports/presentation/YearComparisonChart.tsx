import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import {
	formatYearOverYearDelta,
	withYearOverYearDelta,
} from "../domain/services";
import type { YearComparison } from "../domain/types";

type YearComparisonChartProps = {
	data: YearComparison[];
	currency: string;
};

const chartConfig = {
	total: {
		label: "Yearly total",
		color: "var(--chart-3)",
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

export function YearComparisonChart({
	data,
	currency,
}: YearComparisonChartProps) {
	if (data.length < 2) {
		return (
			<div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
				Need at least 2 years of data for comparison
			</div>
		);
	}

	const enriched = withYearOverYearDelta(data).map((row) => ({
		...row,
		deltaLabel: formatYearOverYearDelta(row.deltaPct),
	}));

	return (
		<div>
			<ChartContainer config={chartConfig} className="h-[300px] w-full">
				<BarChart
					data={enriched}
					margin={{ top: 28, right: 8, bottom: 5, left: 5 }}
				>
					<CartesianGrid vertical={false} strokeDasharray="3 3" />
					<XAxis
						dataKey="year"
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						className="text-xs"
					/>
					<Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]}>
						<LabelList
							dataKey="deltaLabel"
							position="top"
							className="fill-muted-foreground text-[10px] font-medium"
						/>
					</Bar>
					<ChartTooltip
						content={
							<ChartTooltipContent
								formatter={(value) => formatAmount(Number(value), currency)}
							/>
						}
					/>
				</BarChart>
			</ChartContainer>
		</div>
	);
}
