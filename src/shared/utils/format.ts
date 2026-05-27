export function formatCurrency(amount: number, currency: string) {
	return new Intl.NumberFormat(undefined, {
		style: "currency",
		currency,
	}).format(amount);
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
