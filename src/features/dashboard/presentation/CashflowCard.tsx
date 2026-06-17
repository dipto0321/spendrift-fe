import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { formatCurrency } from "@/shared/utils/format";

const miniChartConfig = {
	total: {
		label: "Spending",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

type CashflowPoint = { label: string; total: number };

type CashflowCardProps = {
	data: CashflowPoint[];
	currency: string;
};

export function CashflowCard({ data, currency }: CashflowCardProps) {
	return (
		<section
			className="island-shell rounded-2xl p-6"
			aria-labelledby="cashflow-heading"
		>
			<h2 id="cashflow-heading" className="island-kicker mb-4">
				Cashflow
			</h2>
			{data.length > 0 ? (
				<ChartContainer config={miniChartConfig} className="h-50 w-full">
					<BarChart
						data={data}
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
			) : (
				<p className="m-0 text-sm text-muted-foreground">
					No spending data yet.
				</p>
			)}
		</section>
	);
}
