import { AlertTriangle, FileSpreadsheet, RefreshCw, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useTracker } from "@/features/trackers/presentation/TrackerContext";
import { ApiError } from "@/shared/api/client";
import { EmptyState } from "@/shared/ui/EmptyState";
import { MoneyText } from "@/shared/ui/MoneyText";
import { PageHeader } from "@/shared/ui/PageHeader";
import {
	currentFiscalYear,
	fiscalYearBounds,
	fiscalYearLabel,
	fiscalYearOptions,
} from "../domain/services";
import type { TaxHead, TaxHeadCode } from "../domain/types";
import {
	useCreateTaxReport,
	useRegenerateTaxReport,
	useTaxReport,
	useTaxReportList,
	useUpdateTaxReport,
} from "./useTaxReports";

function ReportSkeleton() {
	return (
		<div className="space-y-4">
			<Skeleton className="h-24 rounded-xl" />
			<Skeleton className="h-96 rounded-xl" />
		</div>
	);
}

function HeadsTable({
	heads,
	currency,
	draft,
	onDraftChange,
	editing,
}: {
	heads: TaxHead[];
	currency: string;
	draft: Record<string, string>;
	onDraftChange: (code: TaxHeadCode, value: string) => void;
	editing: boolean;
}) {
	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-base">IT-10BB heads (9)</CardTitle>
				<p className="text-sm text-muted-foreground">
					Amounts are summed from your expenses per category; the AI only maps
					categories to heads. Edit any head to override the total.
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
								<TableCell className="max-w-[320px] whitespace-normal align-top">
									<p className="m-0 text-sm font-medium leading-none text-foreground">
										{h.headName}
									</p>
									<p className="m-0 mt-1 text-xs leading-relaxed text-muted-foreground">
										{h.description}
									</p>
									<Badge
										variant="outline"
										className="mt-2 font-mono text-[10px]"
									>
										{h.headCode}
									</Badge>
								</TableCell>
								<TableCell className="text-right tabular-nums align-top">
									{editing ? (
										<Input
											type="number"
											inputMode="decimal"
											min={0}
											step="0.01"
											value={draft[h.headCode] ?? String(h.amount)}
											onChange={(e) =>
												onDraftChange(h.headCode, e.target.value)
											}
											className="ml-auto h-9 w-32 text-right"
											aria-label={`${h.headName} amount`}
										/>
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
										<div className="flex flex-wrap gap-1.5">
											{h.categoryAllocations.map((a) => (
												<Badge
													key={a.categoryName}
													variant="secondary"
													className="gap-1.5 font-normal"
													title={`${a.categoryName}: ${a.amount}`}
												>
													<span>{a.categoryName}</span>
													<span className="tabular-nums text-muted-foreground">
														<MoneyText amount={a.amount} currency={currency} />
													</span>
												</Badge>
											))}
										</div>
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

export default function TaxPage() {
	const { activeTracker } = useTracker();
	const trackerId = activeTracker?.id;
	const currency = activeTracker?.currency ?? "";

	const [fiscalYear, setFiscalYear] = useState<string>(() =>
		currentFiscalYear(),
	);
	const options = useMemo(() => fiscalYearOptions(8), []);
	const bounds = useMemo(() => fiscalYearBounds(fiscalYear), [fiscalYear]);

	const { data: summaries } = useTaxReportList(trackerId);
	const {
		data: report,
		isLoading: reportLoading,
		isFetching: reportFetching,
		error: reportError,
	} = useTaxReport(trackerId, fiscalYear);

	const createMut = useCreateTaxReport(trackerId);
	const updateMut = useUpdateTaxReport(trackerId);
	const regenMut = useRegenerateTaxReport(trackerId);

	const is404 = reportError instanceof ApiError && reportError.status === 404;

	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState<Record<string, string>>({});

	useEffect(() => {
		if (report) {
			const next: Record<string, string> = {};
			for (const h of report.heads) next[h.headCode] = String(h.amount);
			setDraft(next);
			setEditing(false);
		}
	}, [report]);

	function handleDraftChange(code: TaxHeadCode, value: string) {
		setDraft((prev) => ({ ...prev, [code]: value }));
	}

	function handleSave() {
		if (!report) return;
		const heads = report.heads.map((h) => {
			const raw = draft[h.headCode] ?? String(h.amount);
			const n = Number(raw);
			return {
				headCode: h.headCode,
				amount: Number.isFinite(n) && n >= 0 ? n : 0,
			};
		});
		updateMut.mutate({ fiscalYear: report.fiscalYear, heads });
		setEditing(false);
	}

	const hasReport = Boolean(report);
	const isBusy =
		createMut.isPending ||
		updateMut.isPending ||
		regenMut.isPending ||
		reportFetching;

	return (
		<main className="flex flex-col gap-6 px-4 pb-14 pt-6">
			<PageHeader
				title="Tax report"
				description="Bangladesh IT-10BB (Income Year). Expenses are aggregated per category between Jul 1 and Jun 30; the AI maps categories to the 9 fixed heads — amounts are always server-summed."
				actions={
					<div className="flex flex-wrap items-center gap-2">
						<Select value={fiscalYear} onValueChange={setFiscalYear}>
							<SelectTrigger className="h-9 w-[180px]" aria-label="Fiscal year">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{options.map((fy) => (
									<SelectItem key={fy} value={fy}>
										{fiscalYearLabel(fy)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{hasReport ? (
							<>
								<Button
									variant={editing ? "default" : "outline"}
									size="sm"
									onClick={() => (editing ? handleSave() : setEditing(true))}
									disabled={isBusy}
								>
									{editing ? (
										<>
											<Save className="size-4" /> Save
										</>
									) : (
										"Edit amounts"
									)}
								</Button>
								{editing ? (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => {
											if (report) {
												const next: Record<string, string> = {};
												for (const h of report.heads)
													next[h.headCode] = String(h.amount);
												setDraft(next);
											}
											setEditing(false);
										}}
									>
										Cancel
									</Button>
								) : null}
								<Button
									variant="outline"
									size="sm"
									onClick={() => regenMut.mutate(fiscalYear)}
									disabled={isBusy}
									title="Re-aggregate from current expenses and re-classify categories"
								>
									<RefreshCw className="size-4" />
									Regenerate
								</Button>
							</>
						) : (
							<Button
								size="sm"
								onClick={() => createMut.mutate(fiscalYear)}
								disabled={isBusy}
							>
								<FileSpreadsheet className="size-4" />
								Generate {fiscalYear}
							</Button>
						)}
					</div>
				}
			/>

			{summaries && summaries.length > 0 ? (
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-xs text-muted-foreground">Saved:</span>
					<ul className="flex flex-wrap gap-1.5">
						{summaries.map((s) => (
							<li key={s.id} className="list-none">
								<button
									type="button"
									onClick={() => setFiscalYear(s.fiscalYear)}
									className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${s.fiscalYear === fiscalYear ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted/30 hover:bg-muted/50"}`}
								>
									{s.fiscalYear} ·{" "}
									<MoneyText amount={s.totalAmount} currency={currency} />
								</button>
							</li>
						))}
					</ul>
				</div>
			) : null}

			{reportLoading ? (
				<ReportSkeleton />
			) : is404 ? (
				<Card className="border-dashed">
					<CardContent className="py-10">
						<EmptyState
							icon={FileSpreadsheet}
							title={`No report for ${fiscalYear}`}
							description={`Income year ${bounds.startDate} → ${bounds.endDate}. Generate to aggregate this tracker's expenses (AI maps categories to the 9 IT-10BB heads).`}
							action={
								<Button
									onClick={() => createMut.mutate(fiscalYear)}
									disabled={isBusy}
								>
									<FileSpreadsheet className="size-4" />
									Generate {fiscalYear}
								</Button>
							}
						/>
					</CardContent>
				</Card>
			) : reportError ? (
				<Card className="border-destructive/40">
					<CardContent className="flex gap-3 py-6">
						<AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
						<div className="min-w-0">
							<p className="m-0 text-sm font-medium text-foreground">
								Could not load tax report
							</p>
							<p className="m-0 mt-1 text-sm text-muted-foreground">
								{reportError instanceof ApiError
									? reportError.message
									: "Something went wrong. Please try again."}
							</p>
						</div>
					</CardContent>
				</Card>
			) : report ? (
				<>
					<Card>
						<CardContent className="flex flex-col gap-1 py-5 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<p className="m-0 text-sm text-muted-foreground">
									Income year {report.fiscalYear} · {report.startDate} →{" "}
									{report.endDate}
								</p>
								<p className="m-0 mt-1 flex items-baseline gap-2">
									<span className="text-xs text-muted-foreground">Total</span>
									<MoneyText
										amount={report.totalAmount}
										currency={report.currency}
										className="text-xl font-semibold tracking-tight"
									/>
									<Badge variant="secondary" className="ml-2">
										{report.currency}
									</Badge>
								</p>
							</div>
							<div className="text-xs text-muted-foreground">
								Updated {new Date(report.updatedAt).toLocaleString()}
							</div>
						</CardContent>
					</Card>

					<HeadsTable
						heads={report.heads}
						currency={report.currency}
						draft={draft}
						onDraftChange={handleDraftChange}
						editing={editing}
					/>
				</>
			) : null}
		</main>
	);
}
