import { Pie, PieChart } from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import type { NeedsWantsSplit } from "@/features/expenses/domain/types";

const chartConfig = {
	needs: { label: "Needs", color: "var(--chart-2)" },
	wants: { label: "Wants", color: "var(--chart-4)" },
} satisfies ChartConfig;

type NeedsVsWantsCardProps = {
	readonly needsWants: NeedsWantsSplit | undefined;
};

export function NeedsVsWantsCard({
	needsWants,
}: NeedsVsWantsCardProps) {
	const hasData = needsWants && (needsWants.needs > 0 || needsWants.wants > 0);

	const chartData = [
		{
			name: "needs",
			value: needsWants?.needs ?? 0,
			fill: "var(--color-needs)",
		},
		{
			name: "wants",
			value: needsWants?.wants ?? 0,
			fill: "var(--color-wants)",
		},
	];

	return (
		<Card>
			<CardHeader>
				<CardTitle>Needs vs Wants</CardTitle>
				<CardDescription>Spending split this month</CardDescription>
			</CardHeader>
			<CardContent>
				{hasData ? (
					<ChartContainer config={chartConfig} className="h-[260px] w-full">
						<PieChart>
							<ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
							<Pie
								data={chartData}
								dataKey="value"
								nameKey="name"
								innerRadius="55%"
								outerRadius="80%"
								paddingAngle={3}
							/>
							<ChartLegend
								content={<ChartLegendContent nameKey="name" />}
								className="mt-2"
							/>
						</PieChart>
					</ChartContainer>
				) : (
					<p className="text-sm text-muted-foreground">No expenses yet.</p>
				)}
			</CardContent>
		</Card>
	);
}

export function NeedsVsWantsCardSkeleton() {
	return (
		<Card>
			<CardHeader>
				<Skeleton className="h-5 w-32" />
				<Skeleton className="h-4 w-44" />
			</CardHeader>
			<CardContent>
				<Skeleton className="h-[260px] w-full rounded-full" />
			</CardContent>
		</Card>
	);
}
