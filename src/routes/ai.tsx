import { Bot, Eye, EyeOff, Lock, Save, Sparkles, Tag, TrendingUp } from "lucide-react";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { requireAuth } from "@/features/auth/presentation/routeGuards";
import { PageHeader } from "@/shared/ui/PageHeader";

export const Route = createFileRoute("/ai")({
	beforeLoad: requireAuth,
	component: AiSettingsPage,
});

type AiFeatureKey = "smartCategorization" | "spendingInsights" | "budgetForecasting";

interface AiSettings {
	apiKey: string;
	baseUrl: string;
	model: string;
	features: Record<AiFeatureKey, boolean>;
}

const DEFAULT_SETTINGS: AiSettings = {
	apiKey: "",
	baseUrl: "https://api.anthropic.com",
	model: "claude-sonnet-4-6",
	features: {
		smartCategorization: false,
		spendingInsights: false,
		budgetForecasting: false,
	},
};

const AI_FEATURES: {
	key: AiFeatureKey;
	label: string;
	description: string;
	icon: typeof Bot;
	badge?: string;
}[] = [
	{
		key: "smartCategorization",
		label: "Smart Categorization",
		description:
			"Automatically suggest categories for new expenses based on the transaction title using AI.",
		icon: Tag,
	},
	{
		key: "spendingInsights",
		label: "Spending Insights",
		description:
			"Get a personalized AI summary of your monthly spending patterns and anomalies.",
		icon: Sparkles,
		badge: "Coming soon",
	},
	{
		key: "budgetForecasting",
		label: "Budget Forecasting",
		description:
			"Let AI predict your end-of-month spend based on current trajectory and historical data.",
		icon: TrendingUp,
		badge: "Coming soon",
	},
];

function loadSettings(): AiSettings {
	try {
		const raw = localStorage.getItem("spendrift:ai-settings");
		if (!raw) return DEFAULT_SETTINGS;
		return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AiSettings>) };
	} catch {
		return DEFAULT_SETTINGS;
	}
}

function AiSettingsPage() {
	const [draft, setDraft] = useState<AiSettings>(loadSettings);
	const [showKey, setShowKey] = useState(false);
	const [saved, setSaved] = useState(false);

	const hasKey = draft.apiKey.trim().length > 0;

	function setFeature(key: AiFeatureKey, value: boolean) {
		setDraft((d) => ({
			...d,
			features: { ...d.features, [key]: value },
		}));
	}

	function handleSave() {
		localStorage.setItem("spendrift:ai-settings", JSON.stringify(draft));
		setSaved(true);
		setTimeout(() => setSaved(false), 2000);
	}

	return (
		<div className="relative">
			<main className="flex flex-col gap-6 px-4 pb-14 pt-6 select-none">
				<div className="mx-auto w-full max-w-3xl flex flex-col gap-6">
					<PageHeader
						title="AI Settings"
						description="Connect an AI provider and enable intelligent features for your spending."
					/>

					<Card>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								handleSave();
							}}
						>
							<CardHeader>
								<div className="flex items-center gap-2">
									<Bot className="size-5 text-muted-foreground" />
									<CardTitle>API Configuration</CardTitle>
								</div>
								<CardDescription>
									Enter your Anthropic API key to enable AI-powered features. Your
									key is stored locally and never sent to Spendrift servers.
								</CardDescription>
							</CardHeader>
							<CardContent className="grid gap-4">
								<div className="grid gap-2">
									<Label htmlFor="ai-api-key">API Key</Label>
									<div className="relative">
										<Input
											id="ai-api-key"
											type={showKey ? "text" : "password"}
											value={draft.apiKey}
											onChange={(e) =>
												setDraft((d) => ({ ...d, apiKey: e.target.value }))
											}
											placeholder="sk-ant-..."
											className="pr-10 font-mono"
											autoComplete="off"
										/>
										<button
											type="button"
											onClick={() => setShowKey((s) => !s)}
											className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
											aria-label={showKey ? "Hide API key" : "Show API key"}
										>
											{showKey ? (
												<EyeOff className="size-4" />
											) : (
												<Eye className="size-4" />
											)}
										</button>
									</div>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="ai-base-url">Base URL</Label>
									<Input
										id="ai-base-url"
										type="url"
										value={draft.baseUrl}
										onChange={(e) =>
											setDraft((d) => ({ ...d, baseUrl: e.target.value }))
										}
										placeholder="https://api.anthropic.com"
										className="font-mono"
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="ai-model">Model</Label>
									<Input
										id="ai-model"
										value={draft.model}
										onChange={(e) =>
											setDraft((d) => ({ ...d, model: e.target.value }))
										}
										placeholder="claude-sonnet-4-6"
										className="font-mono"
									/>
								</div>
							</CardContent>
							<CardFooter className="justify-end border-t border-border">
								<Button type="submit">
									<Save className="size-4" />
									{saved ? "Saved!" : "Save configuration"}
								</Button>
							</CardFooter>
						</form>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Feature Toggles</CardTitle>
							<CardDescription>
								Enable or disable individual AI features.
								{hasKey ? null : (
									<span className="ml-1 text-amber-500 dark:text-amber-400">
										An API key is required to use any feature.
									</span>
								)}
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-1">
							{AI_FEATURES.map((feature, i) => (
								<div key={feature.key}>
									{i > 0 ? <Separator /> : null}
									<div className="flex items-start justify-between gap-4 py-3">
										<div className="flex items-start gap-3">
											<feature.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
											<div className="flex flex-col gap-0.5">
												<div className="flex items-center gap-2">
													<span className="text-sm font-medium text-foreground">
														{feature.label}
													</span>
													{feature.badge ? (
														<Badge variant="secondary" className="text-xs">
															{feature.badge}
														</Badge>
													) : null}
												</div>
												<span className="text-xs text-muted-foreground">
													{feature.description}
												</span>
											</div>
										</div>
										<Switch
											checked={draft.features[feature.key]}
											onCheckedChange={(v) => setFeature(feature.key, v)}
											disabled={!hasKey || feature.badge !== undefined}
											aria-label={feature.label}
										/>
									</div>
								</div>
							))}
						</CardContent>
					</Card>
				</div>
			</main>

			{/* Coming soon shield — blurs content, blocks all interaction */}
			<div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-background/40">
				<div className="flex flex-col items-center gap-5 rounded-2xl border border-border/60 bg-card/80 px-10 py-9 text-center shadow-2xl backdrop-blur-sm">
					<div className="flex items-center justify-center rounded-full bg-muted p-4">
						<Lock className="size-6 text-muted-foreground" />
					</div>
					<div className="flex flex-col gap-1.5">
						<p className="text-lg font-semibold tracking-tight">Coming soon...</p>
						<p className="max-w-[22ch] text-sm text-muted-foreground">
							AI-powered features are on their way.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
