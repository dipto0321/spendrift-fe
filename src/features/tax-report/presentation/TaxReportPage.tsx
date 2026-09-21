import {
	AlertTriangle,
	Copy,
	FileSpreadsheet,
	Info,
	RefreshCw,
	Save,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useTracker } from "@/features/trackers/presentation/TrackerContext";
import { ApiError } from "@/shared/api/client";
import { EmptyState } from "@/shared/ui/EmptyState";
import { MoneyText } from "@/shared/ui/MoneyText";
import { PageHeader } from "@/shared/ui/PageHeader";
import { buildTaxCopyText } from "../domain/copyText";
import {
	buildFiscalYears,
	currentFiscalYear,
	fiscalYearBounds,
	fiscalYearLabel,
} from "../domain/fiscalYears";
import { headAmountSchema } from "../domain/schema";
import type { TaxHeadCode } from "../domain/types";
import { ReportSkeleton, TaxHeadList } from "./TaxHeadList";
import {
	useGenerateTaxReport,
	useRegenerateTaxReport,
	useTaxReport,
	useTaxReportList,
	useUpdateTaxReportHeads,
} from "./useTaxReport";

export default function TaxReportPage() {
	const { activeTracker } = useTracker();
	const trackerId = activeTracker?.id;
	const currency = activeTracker?.currency ?? "BDT";
	const isBdt = currency === "BDT";

	const [fiscalYear, setFiscalYear] = useState<string>(() =>
		currentFiscalYear(),
	);
	const options = useMemo(() => buildFiscalYears(8), []);
	const bounds = useMemo(() => fiscalYearBounds(fiscalYear), [fiscalYear]);

	const { data: summaries } = useTaxReportList(trackerId);
	const {
		data: report,
		isLoading: reportLoading,
		isFetching: reportFetching,
		error: reportError,
	} = useTaxReport(trackerId, fiscalYear);

	const generateMut = useGenerateTaxReport(trackerId);
	const updateMut = useUpdateTaxReportHeads(trackerId);
	const regenMut = useRegenerateTaxReport(trackerId);

	const is404 = reportError instanceof ApiError && reportError.status === 404;

	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState<Record<string, string>>({});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [regenOpen, setRegenOpen] = useState(false);

	useEffect(() => {
		if (report) {
			const next: Record<string, string> = {};
			for (const h of report.heads) next[h.headCode] = String(h.amount);
			setDraft(next);
			setErrors({});
			setEditing(false);
		}
	}, [report]);

	function handleDraftChange(code: TaxHeadCode, value: string) {
		setDraft((prev) => ({ ...prev, [code]: value }));
		const parsed = headAmountSchema.safeParse(value);
		setErrors((prev) => {
			const next = { ...prev };
			if (parsed.success) delete next[code];
			else next[code] = "Enter an amount ≥ 0";
			return next;
		});
	}

	function handleSave() {
		if (!report) return;
		const heads = report.heads.map((h) => {
			const raw = draft[h.headCode] ?? String(h.amount);
			const parsed = headAmountSchema.safeParse(raw);
			return { headCode: h.headCode, parsed };
		});
		const bad = heads.filter((h) => !h.parsed.success);
		if (bad.length > 0) {
			const next: Record<string, string> = {};
			for (const b of bad) next[b.headCode] = "Enter an amount ≥ 0";
			setErrors(next);
			return;
		}
		setErrors({});
		updateMut.mutate(
			{
				fiscalYear: report.fiscalYear,
				heads: heads.map((h) => ({
					headCode: h.headCode,
					amount: h.parsed.success ? h.parsed.data : 0,
				})),
			},
			{ onSuccess: () => setEditing(false) },
		);
	}

	async function handleCopy() {
		if (!report) return;
		try {
			await navigator.clipboard.writeText(
				buildTaxCopyText(report.heads, report.fiscalYear),
			);
			toast.success("Copied");
		} catch {
			toast.error("Could not copy to clipboard");
		}
	}

	const hasReport = Boolean(report);
	const isBusy =
		generateMut.isPending ||
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
									<SelectItem key={fy.value} value={fy.value}>
										{fiscalYearLabel(fy.value)}
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
									disabled={
										isBusy || (editing && Object.keys(errors).length > 0)
									}
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
											setErrors({});
											setEditing(false);
										}}
									>
										Cancel
									</Button>
								) : null}
								<Button
									variant="outline"
									size="sm"
									onClick={handleCopy}
									disabled={isBusy}
								>
									<Copy className="size-4" />
									Copy
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={handleCopy}
									disabled={isBusy}
								>
									<Copy className="size-4" />
									Copy
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setRegenOpen(true)}
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
								onClick={() => generateMut.mutate(fiscalYear)}
								disabled={isBusy}
							>
								<FileSpreadsheet className="size-4" />
								Generate {fiscalYear}
							</Button>
						)}
					</div>
				}
			/>

			{!isBdt ? (
				<Alert>
					<Info className="size-4" />
					<AlertTitle>Non-BDT tracker</AlertTitle>
					<AlertDescription>
						IT-10BB applies to Bangladeshi tax residents. This tracker uses{" "}
						{currency}.
					</AlertDescription>
				</Alert>
			) : null}

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
									onClick={() => generateMut.mutate(fiscalYear)}
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

					<TaxHeadList
						heads={report.heads}
						currency={report.currency}
						draft={draft}
						errors={errors}
						onDraftChange={handleDraftChange}
						editing={editing}
					/>
				</>
			) : null}
			<AlertDialog open={regenOpen} onOpenChange={setRegenOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Regenerate {fiscalYear}?</AlertDialogTitle>
						<AlertDialogDescription>
							This re-aggregates expenses and re-runs AI classification,
							replacing saved amounts including manual edits.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								setRegenOpen(false);
								regenMut.mutate(fiscalYear);
							}}
						>
							Regenerate
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</main>
	);
}
