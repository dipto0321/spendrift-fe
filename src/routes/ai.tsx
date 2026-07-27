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
	Bot,
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
import type { ElementType } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
	type ByoFeatureKey,
	DEFAULT_SETTINGS,
} from "@/shared/ai/types";
import { PageHeader } from "@/shared/ui/PageHeader";

export const Route = createFileRoute("/ai")({
	beforeLoad: requireAuth,
	component: AiSettingsPage,
});

// Built-in features (served by Spendrift's server-side Gemini key) are
// not user-configurable. This list is illustrative — the toggle is
// decorative ("always on") and the description answers "what does this
// do and which provider runs it".
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

// BYO features — toggled by the user's own key.
type ByoFeature = {
	key: ByoFeatureKey;
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

	// Read on mount. Decryption is async, so we kick off the async loader
	// and pull the non-secret parts synchronously first; once the key has
	// been decrypted we update hasKey. `hasEncryptedBlob` keeps the UI in
	// sync during the brief gap before decryption completes (and continues
	// to reflect "key is saved" even if the active session can't decrypt —
	// e.g. right after a token refresh).
	useEffect(() => {
		setHasKey(hasEncryptedBlob());
		const loaded = loadAiSettings();
		setDraft(loaded);
		setStorageError(null);
		loadAiSettingsAsync()
			.then((asyncLoaded) => {
				setDraft(asyncLoaded);
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
			features: { ...draft.features },
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
		setHasKey(false);
		setShowKey(false);
		toast.success("AI settings cleared.");
	}

	function setFeature(key: ByoFeatureKey, value: boolean) {
		setDraft((d) => ({
			...d,
			features: { ...d.features, [key]: value },
		}));
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
								<div className="flex items-start justify-between gap-4 py-3">
									<div className="flex items-start gap-3">
										<feature.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
										<div className="flex flex-col gap-0.5">
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium text-foreground">
													{feature.label}
												</span>
												{feature.comingSoon ? (
													<Badge variant="secondary" className="text-xs">
														Coming soon
													</Badge>
												) : (
													<Badge variant="outline" className="text-xs">
														Built-in
													</Badge>
												)}
											</div>
											<span className="text-xs text-muted-foreground">
												{feature.description}
											</span>
										</div>
									</div>
									<Switch
										checked={!feature.comingSoon}
										disabled={Boolean(feature.comingSoon)}
										aria-label={feature.label}
									/>
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
								<Label htmlFor="ai-api-key">API Key</Label>
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
									aria-invalid={Boolean(errors.baseUrl)}
								/>
								{errors.baseUrl ? (
									<p className="text-xs text-destructive">{errors.baseUrl}</p>
								) : null}
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
									disabled={
										!hasKey && !draft.apiKey && !draft.baseUrl && !draft.model
									}
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
						{BYO_FEATURES.map((feature, i) => {
							const disabled = !hasKey || Boolean(feature.comingSoon);
							return (
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
													{feature.comingSoon ? (
														<Badge variant="secondary" className="text-xs">
															Coming soon
														</Badge>
													) : (
														<Badge variant="outline" className="text-xs">
															Your key
														</Badge>
													)}
												</div>
												<span className="text-xs text-muted-foreground">
													{feature.description}
												</span>
												{!hasKey && !feature.comingSoon ? (
													<span className="mt-1 text-xs text-amber-600 dark:text-amber-400">
														An API key is required.
													</span>
												) : null}
											</div>
										</div>
										<Switch
											checked={draft.features[feature.key]}
											onCheckedChange={(v) => setFeature(feature.key, v)}
											disabled={disabled}
											aria-label={feature.label}
										/>
									</div>
								</div>
							);
						})}
						{hasKey ? null : (
							<p className="mt-2 text-xs text-muted-foreground">
								Open{" "}
								<Link
									to="/reports-ai"
									className="font-medium text-foreground underline-offset-4 hover:underline"
								>
									Smart Report
								</Link>{" "}
								after saving your key.
							</p>
						)}
					</CardContent>
					<CardFooter className="border-t pt-4 text-xs text-muted-foreground">
						<SavedKeysPrivacyNote />
					</CardFooter>
				</Card>
			</div>
		</main>
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
