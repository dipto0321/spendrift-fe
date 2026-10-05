import { evaluateExpression } from "./expression";
import type { ParsedExpense } from "./types";

// Structured smart paste: turn Excel-style "<labels> = <calc>" lines into
// candidate rows without an LLM. The top-level "+" (outside any brackets)
// separates items on BOTH sides; each calculation segment is evaluated as
// math (brackets = grouping) to produce that item's amount.

// Split on "+" at bracket depth 0, ignoring "+" inside any "(...)".
export function splitTopLevel(input: string): string[] {
	const parts: string[] = [];
	let depth = 0;
	let current = "";
	for (const ch of input) {
		if (ch === "(") {
			depth++;
			current += ch;
		} else if (ch === ")") {
			depth--;
			current += ch;
		} else if (ch === "+" && depth === 0) {
			parts.push(current);
			current = "";
		} else {
			current += ch;
		}
	}
	parts.push(current);
	return parts;
}

export type StructuredItem = {
	description: string;
	amount: number;
};

// Parse one "<labels> = <calc>" line into items. Returns null when the line
// isn't structured, the item counts mismatch, any label/segment is empty, or
// the math doesn't evaluate to a positive amount.
export function parseStructuredLine(line: string): StructuredItem[] | null {
	const eq = line.indexOf("=");
	if (eq < 0) return null;

	const labels = splitTopLevel(line.slice(0, eq)).map((s) => s.trim());
	const segments = splitTopLevel(line.slice(eq + 1)).map((s) => s.trim());

	if (labels.some((l) => l.length === 0)) return null;
	if (segments.some((s) => s.length === 0)) return null;
	if (labels.length !== segments.length) return null;

	try {
		const amounts = segments.map((s) => evaluateExpression(s));
		if (amounts.some((a) => a <= 0)) return null;
		return labels.map((description, i) => ({
			description,
			amount: amounts[i],
		}));
	} catch {
		return null;
	}
}

export type StructuredParseResult =
	| { kind: "free-text" }
	| { kind: "invalid"; line: number }
	| { kind: "ok"; rows: ParsedExpense[] };

// Whole-text entry point. Any "=" in the text selects structured mode: every
// non-empty line must parse, otherwise the offending line number is reported
// (structured text never falls back to the AI — math must stay exact). Text
// with no "=" is left for the AI free-text path.
export function parseStructuredText(
	text: string,
	defaultDate: string,
): StructuredParseResult {
	const rawLines = text.split(/\r?\n/);

	if (!rawLines.some((line) => line.includes("="))) {
		return { kind: "free-text" };
	}

	const rows: ParsedExpense[] = [];
	for (let i = 0; i < rawLines.length; i++) {
		const line = rawLines[i].trim();
		if (line.length === 0) continue;
		const items = parseStructuredLine(line);
		if (items === null) return { kind: "invalid", line: i + 1 };
		for (const item of items) {
			rows.push({
				amount: item.amount,
				description: item.description,
				type: "need",
				date: defaultDate,
			});
		}
	}
	return { kind: "ok", rows };
}
