import { ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Category, ParsedExpense } from "../domain/types";
import { useParseExpenses } from "./useExpenses";

type SmartPasteSectionProps = {
	categories: Category[];
	defaultDate: string;
	onParsed: (rows: ParsedExpense[]) => void;
};

export function SmartPasteSection({
	categories,
	defaultDate,
	onParsed,
}: Readonly<SmartPasteSectionProps>) {
	const [open, setOpen] = useState(false);
	const [text, setText] = useState("");
	const parseMutation = useParseExpenses();

	async function handleParse() {
		try {
			const parsed = await parseMutation.mutateAsync({
				text,
				defaultDate,
				categories: categories.map(({ id, name }) => ({ id, name })),
			});
			onParsed(parsed);
			setText("");
		} catch {
			// Error toast comes from useParseExpenses; keep the text for retry.
		}
	}

	return (
		<div className="rounded-lg border border-border/60 bg-muted/30">
			<button
				type="button"
				className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium"
				onClick={() => setOpen((o) => !o)}
				aria-expanded={open}
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
				<div className="flex flex-col gap-2 border-t border-border/60 p-3">
					<Textarea
						value={text}
						onChange={(e) => setText(e.target.value)}
						placeholder={"coffee 120, bus 40, lunch 350 need\ngroceries 800"}
						rows={3}
						aria-label="Expenses text to parse"
					/>
					<div className="flex justify-end">
						<Button
							type="button"
							size="sm"
							onClick={handleParse}
							disabled={parseMutation.isPending || text.trim() === ""}
						>
							{parseMutation.isPending ? "Parsing…" : "Parse into rows"}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
