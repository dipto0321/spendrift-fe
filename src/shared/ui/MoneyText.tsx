import { cn } from "@/lib/utils";
import { formatCurrency } from "@/shared/utils/format";

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
