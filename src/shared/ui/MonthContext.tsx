import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

function todayMonth(): string {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function buildMonthList(count = 13): { value: string; label: string }[] {
	const list: { value: string; label: string }[] = [];
	const now = new Date();
	for (let i = 0; i < count; i++) {
		const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
		const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
		const label = d.toLocaleDateString("en", {
			month: "long",
			year: "numeric",
		});
		list.push({ value, label });
	}
	return list;
}

type MonthContextValue = {
	selectedMonth: string;
	setSelectedMonth: (month: string) => void;
	months: { value: string; label: string }[];
};

const MonthContext = createContext<MonthContextValue | null>(null);

export function MonthProvider({ children }: { children: ReactNode }) {
	const [selectedMonth, setSelectedMonth] = useState(todayMonth);
	const months = useMemo(() => buildMonthList(), []);
	return (
		<MonthContext.Provider value={{ selectedMonth, setSelectedMonth, months }}>
			{children}
		</MonthContext.Provider>
	);
}

export function useMonth() {
	const ctx = useContext(MonthContext);
	if (ctx === null) throw new Error("useMonth must be used inside MonthProvider");
	return ctx;
}
