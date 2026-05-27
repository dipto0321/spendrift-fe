import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { getMonthLabel, getWeekLabel } from "../domain/services";
import type { PeriodData } from "../domain/types";

type SpendingChartProps = {
	data: PeriodData[];
	period: "weekly" | "monthly" | "yearly";
	currency: string;
};

const chartConfig = {
	total: {
		label: "Spending",
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

export function SpendingChart({ data, period, currency }: SpendingChartProps) {
	const chartData = data.map((d) => {
		const label =
			period === "monthly"
				? getMonthLabel(d.label)
				: period === "weekly"
					? getWeekLabel(d.label)
					: d.label;
		return {
			label,
			total: d.total,
		};
	});

	return (
		<div>
			<ChartContainer config={chartConfig} className="h-[300px] w-full">
				<BarChart
					data={chartData}
					margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
				>
					<CartesianGrid vertical={false} strokeDasharray="3 3" />
					<XAxis
						dataKey="label"
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
