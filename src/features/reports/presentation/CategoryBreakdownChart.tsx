import { Cell, Pie, PieChart } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import type { CategoryBreakdown } from "../domain/types";

type CategoryBreakdownChartProps = {
	data: CategoryBreakdown[];
	currency: string;
};

function formatAmount(value: number, currency: string): string {
	return new Intl.NumberFormat(undefined, {
		style: "currency",
		currency,
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

export function CategoryBreakdownChart({
	data,
	currency,
}: CategoryBreakdownChartProps) {
	const chartConfig: ChartConfig = {};
	for (const item of data) {
		chartConfig[item.categoryId] = {
			label: item.categoryName,
			color: item.categoryColor,
		};
	}

	if (data.length === 0) {
		return (
			<div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
				No data available
			</div>
		);
	}

	return (
		<div>
			<ChartContainer config={chartConfig} className="h-[300px] w-full">
				<PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
					<Pie
						data={data}
						dataKey="total"
						nameKey="categoryName"
						cx="50%"
						cy="50%"
						innerRadius={60}
						outerRadius={110}
						paddingAngle={2}
					>
						{data.map((entry) => (
							<Cell key={entry.categoryId} fill={entry.categoryColor} />
						))}
					</Pie>
					<ChartTooltip
						content={
							<ChartTooltipContent
								formatter={(value, name) => {
									const item = data.find((d) => d.categoryName === name);
									const pct = item ? ` (${item.percentage}%)` : "";
									return `${formatAmount(Number(value), currency)}${pct}`;
								}}
							/>
						}
					/>
				</PieChart>
			</ChartContainer>
		</div>
	);
}
