import { getCurrencyDecimals, getCurrencySymbol } from "./currency";

export function formatCurrency(
	amount: number,
	currency: string,
	roundAmounts = false,
) {
	const code = currency?.trim();
	if (code?.length !== 3) {
		return new Intl.NumberFormat("en", {
			maximumFractionDigits: roundAmounts ? 0 : 2,
		}).format(amount);
	}
	const symbol = getCurrencySymbol(code);
	const decimals = roundAmounts ? 0 : getCurrencyDecimals(code);
	const formatted = new Intl.NumberFormat("en", {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	}).format(amount);
	return `${symbol}${formatted}`;
}

export function formatDate(isoDate: string) {
	return new Date(`${isoDate}T12:00:00`).toLocaleDateString(undefined, {
		dateStyle: "medium",
	});
}

export function formatDateShort(isoDate: string) {
	return new Date(`${isoDate}T12:00:00`).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}
