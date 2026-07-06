import { useFormatCurrency } from "@/features/preferences/presentation/useFormatCurrency";
import { cn } from "@/lib/utils";

interface MoneyTextProps {
	amount: number;
	currency: string;
	/** color-code: positive = success, negative = destructive */
	colorize?: boolean;
	/** show explicit +/- sign prefix */
	sign?: boolean;
	className?: string;
}

export function MoneyText({
	amount,
	currency,
	colorize = false,
	sign = false,
	className,
}: MoneyTextProps) {
	const formatCurrency = useFormatCurrency();
	let formatted: string;
	if (sign && amount !== 0) {
		formatted = `${amount > 0 ? "+" : "-"}${formatCurrency(Math.abs(amount), currency)}`;
	} else {
		formatted = formatCurrency(amount, currency);
	}

	return (
		<span
			className={cn(
				"tabular-nums",
				colorize && amount > 0 && "text-success",
				colorize && amount < 0 && "text-destructive",
				className,
			)}
		>
			{formatted}
		</span>
	);
}
