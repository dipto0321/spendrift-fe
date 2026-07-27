// AI Settings page.
//
// The page is honest about the provider split: some AI features use
// Spendrift's built-in Gemini key (no setup, works out of the box) and
// others use the user's own provider key (this page). The split is laid
// out in two visually distinct sections so the user can never confuse
// which features need which key.
//
// Built-in (no setup needed): Smart Paste (always on), Budget Pacing
// (coming soon).
//
// Your provider key (BYO): Smart Report (active), Receipt OCR (coming
// soon). Users paste their Anthropic or OpenAI-compatible key here. We
// encrypt it at rest in localStorage with a key derived from the JWT —
// see shared/ai/crypto.ts.

import { createFileRoute, Link } from "@tanstack/react-router";
import {
	AlertTriangle,
	Bot,
	CheckCircle2,
	CircleHelp,
	Eye,
	EyeOff,
	KeyRound,
	Lock,
	ReceiptText,
	Save,
	Sparkles,
	Tag,
	Trash2,
	TrendingUp,
} from "lucide-react";
import type { ElementType, ReactNode } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { requireAuth } from "@/features/auth/presentation/routeGuards";
import {
	clearAiSettings,
	hasEncryptedBlob,
	loadAiSettings,
	loadAiSettingsAsync,
	saveAiSettings,
} from "@/shared/ai/storage";
import {
	type AiSettings,
	DEFAULT_SETTINGS,
	TOP_N_CATEGORIES_DEFAULT,
	TOP_N_CATEGORIES_MAX,
	TOP_N_CATEGORIES_MIN,
} from "@/shared/ai/types";
import { PageHeader } from "@/shared/ui/PageHeader";

/**
 * Inline `?` icon that reveals a tooltip on hover or focus. Radix's
 * Tooltip handles keyboard focus, screen-reader announcements, and
 * escape-to-close — no custom a11y work needed.
 */
function HelpHint({ children }: { children: ReactNode }) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					aria-label="Help"
					className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
				>
					<CircleHelp className="size-4" />
				</button>
			</TooltipTrigger>
			<TooltipContent
				side="top"
				sideOffset={6}
				className="max-w-xs text-pretty"
			>
				{children}
			</TooltipContent>
		</Tooltip>
	);
}

export const Route = createFileRoute("/ai")({
	beforeLoad: requireAuth,
	component: AiSettingsPage,
});

// Built-in features (served by Spendrift's server-side Gemini key) are
// not user-configurable.
type BuiltInFeature = {
	key: string;
	label: string;
	description: string;
	icon: ElementType;
	comingSoon?: boolean;
};

const BUILT_IN_FEATURES: BuiltInFeature[] = [
	{
		key: "smartPaste",
		label: "Smart Paste",
		description:
			"Paste a list of expenses and get structured rows back. Powered by Spendrift's built-in AI.",
		icon: Tag,
	},
	{
		key: "budgetPacing",
		label: "Budget Pacing",
		description:
			"End-of-month forecast against your budget. Built-in (coming soon).",
		icon: TrendingUp,
		comingSoon: true,
	},
];

// BYO features — gated by whether the user has configured an API key.
type ByoFeature = {
	key: string;
	label: string;
	description: string;
	icon: ElementType;
	comingSoon?: boolean;
};

const BYO_FEATURES: ByoFeature[] = [
	{
		key: "smartReport",
		label: "Smart Report",
		description:
			"AI-written monthly summary: where you spent most, what changed, where to save.",
		icon: Sparkles,
	},
	{
		key: "receiptOcr",
		label: "Receipt OCR",
		description: "Photograph a receipt, get itemized expenses (coming soon).",
		icon: ReceiptText,
		comingSoon: true,
	},
];

function AiSettingsPage() {
	const [draft, setDraft] = useState<AiSettings>(DEFAULT_SETTINGS);
	const [showKey, setShowKey] = useState(false);
	const [storageError, setStorageError] = useState<string | null>(null);
	const [hasKey, setHasKey] = useState(false);
	// Report-preference state. Lives outside `draft` (which mirrors the
	// provider-connection form) so changes to it auto-save without
	// clobbering any unsaved API-key edits in the form above.
	const [categoriesPreference, setCategoriesPreference] = useState<number>(
		DEFAULT_SETTINGS.topNCategories,
	);

	// Read on mount. Decryption is async, so we surface the masked
	// "key is saved" state immediately via hasEncryptedBlob() and update
	// the form state once the async loader completes.
	useEffect(() => {
		setHasKey(hasEncryptedBlob());
		const loaded = loadAiSettings();
		setDraft(loaded);
		setCategoriesPreference(loaded.topNCategories);
		setStorageError(null);
		loadAiSettingsAsync()
			.then((asyncLoaded) => {
				setDraft(asyncLoaded);
				setCategoriesPreference(asyncLoaded.topNCategories);
				setHasKey(asyncLoaded.apiKey.length > 0);
			})
			.catch(() => {
				// Decryption failure already dropped the blob in
				// loadAiSettingsAsync; nothing more to do.
				setHasKey(false);
			});
	}, []);

	const errors = {
		apiKey: draft.apiKey.trim().length === 0 ? "Add an API key." : null,
		baseUrl:
			draft.baseUrl.trim().length === 0
				? "Base URL is required."
				: (() => {
						try {
							new URL(draft.baseUrl.trim());
							return null;
						} catch {
							return "Base URL must be a valid URL.";
						}
					})(),
		model: draft.model.trim().length === 0 ? "Model is required." : null,
	};
	const hasErrors = Boolean(errors.apiKey || errors.baseUrl || errors.model);

	async function handleSave() {
		setStorageError(null);
		if (hasErrors) return;
		const trimmedKey = draft.apiKey.trim();
		const cleaned: AiSettings = {
			apiKey: trimmedKey,
			baseUrl: draft.baseUrl.trim(),
			model: draft.model.trim(),
			topNCategories: categoriesPreference,
		};
		try {
			await saveAiSettings(cleaned);
			// `hasKey` reflects what's stored: if the user typed a new key
			// it's there; if not, storage preserved the previous one.
			setHasKey(trimmedKey.length > 0 || hasKey);
			toast.success(
				trimmedKey.length > 0
					? "API key saved. Your key is encrypted in this browser."
					: hasKey
						? "Settings saved. Your saved key is unchanged."
						: "Settings saved.",
			);
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			setStorageError(msg);
			toast.error(msg);
		}
	}

	function handleClear() {
		clearAiSettings();
		setDraft({ ...DEFAULT_SETTINGS });
		setCategoriesPreference(DEFAULT_SETTINGS.topNCategories);
		setHasKey(false);
		setShowKey(false);
		toast.success("AI settings cleared.");
	}

	async function handleCategoriesChange(value: number) {
		setCategoriesPreference(value);
		try {
			// Preserve the encrypted API key blob; pass empty apiKey so
			// saveAiSettings skips the encryption step.
			await saveAiSettings({
				apiKey: "",
				baseUrl: loadAiSettings().baseUrl,
				model: loadAiSettings().model,
				topNCategories: value,
			});
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			toast.error(msg);
		}
	}

	return (
		<main className="flex flex-col gap-6 px-4 pb-14 pt-6 select-none">
			<div className="mx-auto w-full max-w-3xl flex flex-col gap-6">
				<PageHeader
					title="AI Settings"
					description="Some features use Spendrift's built-in AI. Others use your own provider key. Pick what you want to enable."
				/>

				{storageError ? (
					<Alert variant="destructive">
						<AlertTitle>Couldn't save</AlertTitle>
						<AlertDescription>{storageError}</AlertDescription>
					</Alert>
				) : null}

				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<Bot className="size-5 text-muted-foreground" />
							<CardTitle>Built-in AI</CardTitle>
							<Badge variant="secondary" className="text-xs">
								No setup needed
							</Badge>
						</div>
						<CardDescription>
							These features run on Spendrift's server-side key. Sign in is all
							you need — no API key, no extra cost.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-1">
						{BUILT_IN_FEATURES.map((feature, i) => (
							<div key={feature.key}>
								{i > 0 ? <Separator /> : null}
								<div className="flex items-start gap-3 py-3">
									<feature.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
									<div className="flex flex-col gap-0.5">
										<div className="flex flex-wrap items-center gap-2">
											<span className="text-sm font-medium text-foreground">
												{feature.label}
											</span>
											{feature.comingSoon ? (
												<Badge variant="secondary" className="text-xs">
													Coming soon
												</Badge>
											) : (
												<Badge
													variant="outline"
													className="gap-1 text-xs text-emerald-600 dark:text-emerald-400"
												>
													<CheckCircle2 className="size-3" />
													Built-in
												</Badge>
											)}
										</div>
										<span className="text-xs text-muted-foreground">
											{feature.description}
										</span>
									</div>
								</div>
							</div>
						))}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<KeyRound className="size-5 text-muted-foreground" />
							<CardTitle>Your provider key</CardTitle>
							<Badge variant="outline" className="text-xs">
								Bring your own
							</Badge>
						</div>
						<CardDescription>
							These features use your own Anthropic or OpenAI-compatible key.
							Your key is encrypted in this browser with your session —
							Spendrift never sees it. Billed to your provider account.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<form
							className="grid gap-4"
							onSubmit={async (e) => {
								e.preventDefault();
								await handleSave();
							}}
						>
							<div className="grid gap-2">
								<div className="flex items-center gap-1.5">
									<Label htmlFor="ai-api-key">API Key</Label>
									<HelpHint>
										Your provider's secret key (e.g.{" "}
										<code className="rounded bg-background/40 px-1 font-mono text-[11px]">
											sk-ant-...
										</code>
										). It's encrypted with your session and only held in this
										browser — Spendrift never sees it. Billed to your provider.
									</HelpHint>
								</div>
								<div className="relative">
									<Input
										id="ai-api-key"
										type={showKey ? "text" : "password"}
										value={draft.apiKey}
										onChange={(e) =>
											setDraft((d) => ({ ...d, apiKey: e.target.value }))
										}
										placeholder={hasKey ? "••••••••••••" : "sk-ant-..."}
										className="pr-10 font-mono"
										autoComplete="off"
										aria-invalid={Boolean(errors.apiKey)}
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
								{errors.apiKey ? (
									<p className="text-xs text-destructive">{errors.apiKey}</p>
								) : null}
								{hasKey ? (
									<p className="flex items-center gap-1.5 text-xs text-muted-foreground">
										<Lock className="size-3" />
										Key is encrypted with your session and only held in this
										browser.
									</p>
								) : null}
							</div>
							<div className="grid gap-2">
								<div className="flex items-center gap-1.5">
									<Label htmlFor="ai-base-url">Base URL</Label>
									<HelpHint>
										The provider's chat-completions endpoint. Use{" "}
										<code className="rounded bg-background/40 px-1 font-mono text-[11px]">
											https://api.anthropic.com
										</code>{" "}
										for Anthropic, or any OpenAI-compatible URL (OpenRouter,
										Groq, Together, your own proxy).
									</HelpHint>
								</div>
								<Input
									id="ai-base-url"
									type="url"
									value={draft.baseUrl}
									onChange={(e) =>
										setDraft((d) => ({ ...d, baseUrl: e.target.value }))
									}
									placeholder="https://api.anthropic.com"
									className="font-mono"
									aria-invalid={Boolean(errors.baseUrl)}
								/>
								{errors.baseUrl ? (
									<p className="text-xs text-destructive">{errors.baseUrl}</p>
								) : null}
							</div>
							<div className="grid gap-2">
								<div className="flex items-center gap-1.5">
									<Label htmlFor="ai-model">Model</Label>
									<HelpHint>
										The model ID your provider expects. Examples:{" "}
										<code className="rounded bg-background/40 px-1 font-mono text-[11px]">
											claude-sonnet-4-6
										</code>{" "}
										for Anthropic,{" "}
										<code className="rounded bg-background/40 px-1 font-mono text-[11px]">
											anthropic/claude-sonnet-4-5
										</code>{" "}
										for OpenRouter. Must be a model your account can access.
									</HelpHint>
								</div>
								<Input
									id="ai-model"
									value={draft.model}
									onChange={(e) =>
										setDraft((d) => ({ ...d, model: e.target.value }))
									}
									placeholder="claude-sonnet-4-6"
									className="font-mono"
									aria-invalid={Boolean(errors.model)}
								/>
								{errors.model ? (
									<p className="text-xs text-destructive">{errors.model}</p>
								) : null}
							</div>
							<div className="flex flex-wrap items-center justify-end gap-2">
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={handleClear}
								>
									<Trash2 className="size-4" />
									Clear
								</Button>
								<Button type="submit" disabled={hasErrors}>
									<Save className="size-4" />
									Save configuration
								</Button>
							</div>
						</form>
					</CardContent>
					<Separator />
					<CardContent className="flex flex-col gap-1 pt-4">
						{BYO_FEATURES.map((feature, i) => (
							<ByoFeatureRow
								key={feature.key}
								feature={feature}
								hasKey={hasKey}
								showDivider={i > 0}
							/>
						))}
						{hasKey ? (
							<p className="mt-2 text-xs text-muted-foreground">
								Open{" "}
								<Link
									to="/reports-ai"
									className="font-medium text-foreground underline-offset-4 hover:underline"
								>
									Smart Report
								</Link>{" "}
								to use your key.
							</p>
						) : null}
					</CardContent>
					<CardFooter className="border-t pt-4 text-xs text-muted-foreground">
						<SavedKeysPrivacyNote />
					</CardFooter>
				</Card>

				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<Sparkles className="size-5 text-muted-foreground" />
							<CardTitle>Report preferences</CardTitle>
						</div>
						<CardDescription>
							Adjust how the Smart Report is presented. Changes save
							automatically and don't affect your provider connection.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-2">
							<div className="flex items-center gap-1.5">
								<Label htmlFor="ai-top-n-categories">
									Categories per report
								</Label>
								<HelpHint>
									How many categories the Smart Report includes in its
									"Categories" section. Higher = more detail but the prompt sent
									to your LLM grows, so each generation costs a little more.
									Default is {TOP_N_CATEGORIES_DEFAULT}. The Smart Report caps
									the LLM input at {TOP_N_CATEGORIES_MAX} categories even if
									your tracker has more.
								</HelpHint>
							</div>
							<Select
								value={String(categoriesPreference)}
								onValueChange={(v) => handleCategoriesChange(Number(v))}
							>
								<SelectTrigger
									id="ai-top-n-categories"
									className="w-full sm:max-w-xs"
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{Array.from(
										{
											length: TOP_N_CATEGORIES_MAX - TOP_N_CATEGORIES_MIN + 1,
										},
										(_, i) => i + TOP_N_CATEGORIES_MIN,
									).map((n) => (
										<SelectItem key={n} value={String(n)}>
											{n}
											{n === TOP_N_CATEGORIES_DEFAULT ? " (default)" : ""}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}

function ByoFeatureRow({
	feature,
	hasKey,
	showDivider,
}: {
	feature: ByoFeature;
	hasKey: boolean;
	showDivider: boolean;
}) {
	// Status is derived: a comingSoon feature always says "Coming soon";
	// otherwise it is Ready when a key is configured and "Needs API key"
	// when not. There is no user-toggle.
	const Icon = feature.icon;
	const status = feature.comingSoon
		? {
				label: "Coming soon",
				variant: "secondary" as const,
				icon: null,
				className: "",
				helperText: null,
			}
		: hasKey
			? {
					label: "Ready",
					variant: "outline" as const,
					icon: CheckCircle2,
					className:
						"gap-1 text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
					helperText: "Powered by your provider key.",
				}
			: {
					label: "Needs API key",
					variant: "outline" as const,
					icon: AlertTriangle,
					className:
						"gap-1 text-xs text-amber-600 dark:text-amber-400 border-amber-500/30",
					helperText: "Add an API key above to use this.",
				};

	const StatusIcon = status.icon;
	return (
		<div>
			{showDivider ? <Separator /> : null}
			<div className="flex items-start gap-3 py-3">
				<Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
				<div className="flex flex-col gap-0.5">
					<div className="flex flex-wrap items-center gap-2">
						<span className="text-sm font-medium text-foreground">
							{feature.label}
						</span>
						<Badge variant={status.variant} className={status.className}>
							{StatusIcon ? <StatusIcon className="size-3" /> : null}
							{status.label}
						</Badge>
					</div>
					<span className="text-xs text-muted-foreground">
						{feature.description}
					</span>
					{status.helperText ? (
						<span className="mt-1 text-xs text-muted-foreground">
							{status.helperText}
						</span>
					) : null}
				</div>
			</div>
		</div>
	);
}

function SavedKeysPrivacyNote() {
	return (
		<span>
			Your key is encrypted with a key derived from your Spendrift session and
			stored only in this browser. Removing the key clears its stored copy.
		</span>
	);
}
