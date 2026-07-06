import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
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
	avg: {
		label: "Monthly average",
		color: "var(--chart-1)",
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

	return (
		<div>
			<ChartContainer config={chartConfig} className="h-[300px] w-full">
				<BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
					<CartesianGrid vertical={false} strokeDasharray="3 3" />
					<XAxis
						dataKey="year"
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						className="text-xs"
					/>
					<Bar
						dataKey="total"
						fill="var(--color-total)"
						radius={[4, 4, 0, 0]}
					/>
					<Bar dataKey="avg" fill="var(--color-avg)" radius={[4, 4, 0, 0]} />
					<ChartTooltip
						content={
							<ChartTooltipContent
								formatter={(value) => formatAmount(Number(value), currency)}
							/>
						}
					/>
					<ChartLegend content={<ChartLegendContent />} />
				</BarChart>
			</ChartContainer>
		</div>
	);
}
