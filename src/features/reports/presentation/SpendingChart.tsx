import { useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Line,
	LineChart,
	XAxis,
	YAxis,
} from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useFormatCurrency } from "@/features/preferences/presentation/useFormatCurrency";
import { getMonthLabel, getWeekLabel } from "../domain/services";
import type { PeriodData } from "../domain/types";

type ChartType = "line" | "bar";

type SpendingChartProps = {
	readonly data: PeriodData[];
	readonly period: "weekly" | "monthly" | "yearly";
	readonly currency: string;
};

const chartConfig = {
	total: { label: "Spending", color: "var(--chart-1)" },
} satisfies ChartConfig;

const PERIOD_LABELS: Record<string, string> = {
	weekly: "Spending by week",
	monthly: "Spending by month",
	yearly: "Spending by year",
};

const AXIS_MARGIN = { left: 4, right: 8, top: 8 };

function yAxisFormatter(
	v: number,
	currency: string,
	formatCurrency: (amount: number, currency: string) => string,
): string {
	const formatted = formatCurrency(v, currency);
	return formatted.replace(/\.00$/, "").replace(/,000$/, "k");
}

export function SpendingChart({ data, period, currency }: SpendingChartProps) {
	const [chartType, setChartType] = useState<ChartType>("bar");
	const formatCurrency = useFormatCurrency();

	const chartData = data.map((d) => {
		let label = d.label;
		if (period === "monthly") label = getMonthLabel(d.label);
		else if (period === "weekly") label = getWeekLabel(d.label);
		return { label, total: d.total };
	});

	function handleChartTypeChange(v: string) {
		if (v === "line" || v === "bar") setChartType(v);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<CardTitle>Spending trend</CardTitle>
						<CardDescription>
							{PERIOD_LABELS[period] ?? "Spending over time"}
						</CardDescription>
					</div>
					<ToggleGroup
						type="single"
						value={chartType}
						onValueChange={handleChartTypeChange}
						variant="outline"
						size="sm"
					>
						<ToggleGroupItem value="line">Line</ToggleGroupItem>
						<ToggleGroupItem value="bar">Bar</ToggleGroupItem>
					</ToggleGroup>
				</div>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig} className="h-[280px] w-full">
					{chartType === "line" ? (
						<LineChart data={chartData} margin={AXIS_MARGIN}>
							<CartesianGrid vertical={false} strokeDasharray="3 3" />
							<XAxis
								dataKey="label"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								className="text-xs"
							/>
							<YAxis
								tickLine={false}
								axisLine={false}
								width={52}
								tickFormatter={(v) =>
									yAxisFormatter(Number(v), currency, formatCurrency)
								}
								className="text-xs"
							/>
							<ChartTooltip
								content={
									<ChartTooltipContent
										formatter={(value) =>
											formatCurrency(Number(value), currency)
										}
									/>
								}
							/>
							<Line
								dataKey="total"
								type="monotone"
								stroke="var(--color-total)"
								strokeWidth={2}
								dot={{ r: 3 }}
								activeDot={{ r: 5 }}
							/>
						</LineChart>
					) : (
						<BarChart data={chartData} margin={AXIS_MARGIN}>
							<CartesianGrid vertical={false} strokeDasharray="3 3" />
							<XAxis
								dataKey="label"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								className="text-xs"
							/>
							<YAxis
								tickLine={false}
								axisLine={false}
								width={52}
								tickFormatter={(v) =>
									yAxisFormatter(Number(v), currency, formatCurrency)
								}
								className="text-xs"
							/>
							<ChartTooltip
								content={
									<ChartTooltipContent
										formatter={(value) =>
											formatCurrency(Number(value), currency)
										}
									/>
								}
							/>
							<Bar
								dataKey="total"
								fill="var(--color-total)"
								radius={[4, 4, 0, 0]}
							/>
						</BarChart>
					)}
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
