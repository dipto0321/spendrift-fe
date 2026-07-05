import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useFormatCurrency } from "@/features/preferences/presentation/useFormatCurrency";

const chartConfig = {
	total: { label: "Spending", color: "var(--chart-1)" },
} satisfies ChartConfig;

type CashflowPoint = { label: string; total: number };

type CashflowCardProps = {
	readonly data: CashflowPoint[];
	readonly currency: string;
};

export function CashflowCard({ data, currency }: CashflowCardProps) {
	const formatCurrency = useFormatCurrency();
	return (
		<Card className="h-full">
			<CardHeader>
				<CardTitle>Spending trend</CardTitle>
				<CardDescription>
					Monthly spending over the last 6 months
				</CardDescription>
			</CardHeader>
			<CardContent>
				{data.length === 0 ? (
					<p className="text-sm text-muted-foreground">No data yet.</p>
				) : (
					<ChartContainer config={chartConfig} className="h-[260px] w-full">
						<AreaChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
							<defs>
								<linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
									<stop
										offset="5%"
										stopColor="var(--color-total)"
										stopOpacity={0.3}
									/>
									<stop
										offset="95%"
										stopColor="var(--color-total)"
										stopOpacity={0}
									/>
								</linearGradient>
							</defs>
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
									formatCurrency(Number(v), currency)
										.replace(/\.00$/, "")
										.replace(/,000$/, "k")
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
							<Area
								dataKey="total"
								type="monotone"
								stroke="var(--color-total)"
								fill="url(#fillTotal)"
								strokeWidth={2}
							/>
						</AreaChart>
					</ChartContainer>
				)}
			</CardContent>
		</Card>
	);
}

export function CashflowCardSkeleton() {
	return (
		<Card>
			<CardHeader>
				<Skeleton className="h-5 w-32" />
				<Skeleton className="h-4 w-52" />
			</CardHeader>
			<CardContent>
				<Skeleton className="h-[260px] w-full" />
			</CardContent>
		</Card>
	);
}
