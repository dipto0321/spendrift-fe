import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useFormatCurrency } from "@/features/preferences/presentation/useFormatCurrency";
import type { BudgetAlert } from "../domain/types";

type BudgetAlertBannerProps = {
	alerts: BudgetAlert[];
	currency: string;
};

export function BudgetAlertBanner({
	alerts,
	currency,
}: Readonly<BudgetAlertBannerProps>) {
	const [dismissed, setDismissed] = useState(false);
	const formatCurrency = useFormatCurrency();
	const active = alerts.filter((a) => a.level !== "ok");

	if (dismissed || active.length === 0) return null;

	const hasExceeded = active.some((a) => a.level === "exceeded");

	return (
		<Alert variant={hasExceeded ? "destructive" : "default"} className="pr-10">
			<AlertTriangle />
			<AlertTitle>
				{hasExceeded ? "Budget exceeded" : "Approaching budget limit"}
			</AlertTitle>
			<AlertDescription>
				<ul className="flex flex-col gap-1">
					{active.map((a) => (
						<li key={a.categoryId}>
							{a.categoryName} — {formatCurrency(a.spent, currency)} of{" "}
							{formatCurrency(a.limit, currency)} ({a.percentage}%)
						</li>
					))}
				</ul>
			</AlertDescription>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				className="absolute right-2 top-2 size-6"
				onClick={() => setDismissed(true)}
				aria-label="Dismiss budget alert"
			>
				<X className="size-3.5" />
			</Button>
		</Alert>
	);
}
