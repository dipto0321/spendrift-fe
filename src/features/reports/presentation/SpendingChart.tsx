import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { formatCurrency } from "@/shared/utils/format";
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

export function SpendingChart({
	data,
	period,
	currency,
}: Readonly<SpendingChartProps>) {
	const chartData = data.map((d) => {
		let label = d.label;

		if (period === "monthly") {
			label = getMonthLabel(d.label);
		} else if (period === "weekly") {
			label = getWeekLabel(d.label);
		}

		return {
			label,
			total: d.total,
		};
	});

	return (
		<div>
			<ChartContainer config={chartConfig} className="h-75 w-full">
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
								formatter={(value) => formatCurrency(Number(value), currency)}
							/>
						}
					/>
				</BarChart>
			</ChartContainer>
		</div>
	);
}
