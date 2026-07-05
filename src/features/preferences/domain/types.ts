export type Preferences = {
	budgetAlerts: boolean;
	weeklySummary: boolean;
	roundAmounts: boolean;
};

export type PreferencesPatch = Partial<Preferences>;
