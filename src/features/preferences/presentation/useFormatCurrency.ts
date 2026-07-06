import { formatCurrency } from "@/shared/utils/format";
import { usePreferences } from "./usePreferences";

// Wraps formatCurrency with the user's "Round amounts" preference so callers
// don't have to thread the flag through manually.
export function useFormatCurrency() {
	const { data: prefs } = usePreferences();
	const roundAmounts = prefs?.roundAmounts ?? false;
	return (amount: number, currency: string) =>
		formatCurrency(amount, currency, roundAmounts);
}
