import { ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTracker } from "@/features/trackers/presentation/TrackerContext";
import {
	mergeAiEnrichment,
	parseStructuredText,
	toAiHintText,
} from "../domain/smartPaste";
import type { ParsedExpense } from "../domain/types";
import { useParseExpenses } from "./useExpenses";

type SmartPasteSectionProps = {
	defaultDate: string;
	onParsed: (rows: ParsedExpense[]) => void;
};

export function SmartPasteSection({
	defaultDate,
	onParsed,
}: Readonly<SmartPasteSectionProps>) {
	const { activeTracker } = useTracker();
	const [open, setOpen] = useState(false);
	const [text, setText] = useState("");
	const [isParsing, setIsParsing] = useState(false);
	const parsingRef = useRef(false);
	const parseMutation = useParseExpenses(activeTracker?.id);

	async function handleParse() {
		// Re-entrancy guard: a rapid double-click must not double-parse (the
		// structured path is synchronous, so the button never shows a pending
		// state without this guard).
		if (parsingRef.current) return;
		const trimmed = text.trim();
		if (trimmed === "") return;

		parsingRef.current = true;
		setIsParsing(true);
		try {
			// Excel-style "labels = math" lines are parsed locally (exact math),
			// then enriched with AI-inferred category/type. Anything that isn't
			// cleanly structured falls back to the AI endpoint as before.
			const structured = parseStructuredText(trimmed, defaultDate);
			if (structured.kind === "ok") {
				let rows = structured.rows;
				try {
					const aiRows = await parseMutation.mutateAsync({
						text: toAiHintText(rows),
						defaultDate,
					});
					rows = mergeAiEnrichment(rows, aiRows);
				} catch {
					// AI enrichment failed; keep the exact-math rows (blank
					// category/type) rather than losing the parsed amounts.
				}
				onParsed(rows);
				setText("");
				return;
			}

			const parsed = await parseMutation.mutateAsync({ text, defaultDate });
			onParsed(parsed);
			setText("");
		} catch {
			// Error toast comes from useParseExpenses; keep the text for retry.
		} finally {
			parsingRef.current = false;
			setIsParsing(false);
		}
	}

	return (
		<div className="rounded-lg border border-border/60 bg-muted/30">
			<button
				type="button"
				className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium"
				onClick={() => setOpen((o) => !o)}
				aria-expanded={open}
				aria-controls="smart-paste-panel"
			>
				{open ? (
					<ChevronDown className="size-4 text-muted-foreground" />
				) : (
					<ChevronRight className="size-4 text-muted-foreground" />
				)}
				<Sparkles className="size-4 text-primary" />
				Smart paste
				<span className="ml-1 font-normal text-muted-foreground">
					— paste text, get rows to review
				</span>
			</button>
			{open && (
				<div
					id="smart-paste-panel"
					className="flex flex-col gap-2 border-t border-border/60 p-3"
				>
					<Textarea
						value={text}
						onChange={(e) => setText(e.target.value)}
						placeholder={
							"Item 1 + Item 2 = 100 + 200\nGroceries = (50 + 50)\ncoffee 120, bus 40 need"
						}
						rows={3}
						aria-label="Expenses text to parse"
						disabled={parseMutation.isPending}
					/>
					<div className="flex justify-end">
						<Button
							type="button"
							size="sm"
							onClick={handleParse}
							disabled={isParsing || text.trim() === ""}
						>
							{isParsing ? "Parsing…" : "Parse into rows"}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
