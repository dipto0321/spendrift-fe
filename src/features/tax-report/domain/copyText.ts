import type { TaxHead } from "./types";

// Pure helper that formats the 9 heads as TSV for clipboard copy.
// Unit-testable: no navigator.clipboard access here (V24-adjacent copy flow).
export function buildTaxCopyText(heads: TaxHead[], fiscalYear: string): string {
	const lines = heads.map((h) => `${h.headName}\t${h.amount.toFixed(2)}`);
	const total = heads.reduce((sum, h) => sum + h.amount, 0);
	lines.push(`Total\t${total.toFixed(2)}`);
	return `IT-10BB ${fiscalYear}\n${lines.join("\n")}`;
}
