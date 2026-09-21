import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { MoneyText } from "@/shared/ui/MoneyText";
import type { TaxHead, TaxHeadCode } from "../domain/types";

export function TaxHeadList({
	heads,
	currency,
	draft,
	errors,
	onDraftChange,
	editing,
}: {
	heads: TaxHead[];
	currency: string;
	draft: Record<string, string>;
	errors: Record<string, string>;
	onDraftChange: (code: TaxHeadCode, value: string) => void;
	editing: boolean;
}) {
	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-base">IT-10BB heads (9)</CardTitle>
				<p className="text-sm text-muted-foreground">
					Amounts are summed from your expenses. Edit a head to override.
				</p>
			</CardHeader>
			<CardContent className="p-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[36%]">Head</TableHead>
							<TableHead className="text-right">Amount</TableHead>
							<TableHead>Categories</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{heads.map((h) => (
							<TableRow key={h.headCode}>
								<TableCell className="max-w-[320px] align-top">
									<p className="m-0 text-sm font-medium text-foreground">
										{h.headName}
									</p>
									<p className="m-0 mt-1 text-xs text-muted-foreground">
										{h.description}
									</p>
									<Badge
										variant="outline"
										className="mt-2 font-mono text-[10px]"
									>
										{h.headCode}
									</Badge>
								</TableCell>
								<TableCell className="text-right align-top">
									{editing ? (
										<div className="ml-auto w-32">
											<Input
												type="number"
												min={0}
												step="0.01"
												value={draft[h.headCode] ?? String(h.amount)}
												onChange={(e) =>
													onDraftChange(h.headCode, e.target.value)
												}
												className="h-9 text-right"
												aria-label={`${h.headName} amount`}
											/>
											{errors[h.headCode] ? (
												<p className="m-0 mt-1 text-xs text-destructive">
													{errors[h.headCode]}
												</p>
											) : null}
										</div>
									) : (
										<MoneyText
											amount={h.amount}
											currency={currency}
											className="text-sm font-semibold"
										/>
									)}
								</TableCell>
								<TableCell className="align-top">
									{h.categoryAllocations.length === 0 ? (
										<span className="text-xs text-muted-foreground">—</span>
									) : (
										<details>
											<summary className="cursor-pointer text-xs text-muted-foreground">
												{h.categoryAllocations.length} categories
											</summary>
											<div className="mt-2 flex flex-wrap gap-1.5">
												{h.categoryAllocations.map((a) => (
													<Badge key={a.categoryName} variant="secondary">
														{a.categoryName} ·{" "}
														<MoneyText amount={a.amount} currency={currency} />
													</Badge>
												))}
											</div>
										</details>
									)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}

export function ReportSkeleton() {
	return (
		<div className="space-y-4">
			<Skeleton className="h-24 rounded-xl" />
			<Skeleton className="h-96 rounded-xl" />
		</div>
	);
}
