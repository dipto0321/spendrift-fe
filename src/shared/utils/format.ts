export function formatCurrency(amount: number, currency: string) {
	if (currency?.trim().length !== 3) {
		return new Intl.NumberFormat(undefined, {
			maximumFractionDigits: 2,
		}).format(amount);
	}

	try {
		return new Intl.NumberFormat(undefined, {
			style: "currency",
			currency: currency.toUpperCase(),
		}).format(amount);
	} catch {
		return new Intl.NumberFormat(undefined, {
			maximumFractionDigits: 2,
		}).format(amount);
	}
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
