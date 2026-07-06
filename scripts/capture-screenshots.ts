/**
 * Capture scripts/capture-screenshots.ts
 *
 * Re-captures the PNGs in docs/screenshots/ against a running dev server.
 * See docs/screenshots/CAPTURE.md for usage and the required env vars.
 *
 *   pnpm capture:screenshots:install   # one-time: downloads chromium
 *   pnpm capture:screenshots           # actual capture
 *
 * Override the URLs/credentials via env vars if needed:
 *   SCREENSHOT_BASE=http://localhost:3000
 *   SCREENSHOT_API_BASE=http://localhost:8000/api/v1
 *   SCREENSHOT_EMAIL=demo@example.com
 *   SCREENSHOT_PASSWORD=Demo@1234
 *   SCREENSHOT_TRACKER_ID=<id>          # skip auto-detection
 *   SCREENSHOT_MONTH=YYYY-MM            # defaults to current UTC month
 *   SCREENSHOT_FORCE_ALERT=1            # capture dashboard-alert.png even
 *                                       # if no alerts are present
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page, type APIRequestContext } from "playwright";

const BASE = process.env.SCREENSHOT_BASE ?? "http://localhost:3000";
// Strip a trailing /api/v1 if the user passed the full URL — Playwright's
// request fixture expects a bare origin.
const API_RAW = process.env.SCREENSHOT_API_BASE ?? "http://localhost:8000/api/v1";
const API_ORIGIN = API_RAW.replace(/\/api\/v\d+$/, "");
const EMAIL = process.env.SCREENSHOT_EMAIL ?? "demo@example.com";
const PASSWORD = process.env.SCREENSHOT_PASSWORD ?? "Demo@1234";
const OUT = join(process.cwd(), "docs", "screenshots");

type Shot = {
	name: string;
	path: string;
	width: number;
	height: number;
	fullPage?: boolean;
	/** When true, wait for the authenticated app shell (sidebar brand) to render. */
	authenticated?: boolean;
	setup?: (page: Page) => Promise<void>;
};

const SHOTS: Shot[] = [
	{
		name: "sign-in",
		path: "/sign-in",
		width: 1400,
		height: 900,
		setup: async (page) => {
			// Wait for the form (not the "Loading…" splash).
			await page.getByRole("button", { name: /sign in/i }).waitFor();
		},
	},
	{
		name: "sign-up",
		path: "/sign-up",
		width: 1400,
		height: 900,
		setup: async (page) => {
			await page.getByRole("button", { name: /sign up|create/i }).waitFor();
		},
	},
	{
		name: "dashboard",
		path: "/",
		width: 1400,
		height: 908,
		authenticated: true,
		setup: async (page) => {
			await page.waitForSelector("main");
		},
	},
	{ name: "expenses", path: "/expenses", width: 1400, height: 908, authenticated: true },
	{ name: "budget", path: "/budget", width: 1400, height: 908, authenticated: true },
	{
		name: "reports",
		path: "/reports",
		width: 1400,
		height: 1347,
		fullPage: true,
		authenticated: true,
	},
	{
		name: "settings",
		path: "/settings",
		width: 1400,
		height: 1100,
		authenticated: true,
		setup: async (page) => {
			// The Preferences card title is a CardTitle <div> (not a heading
			// role). Use the shadcn data-slot to disambiguate from the
			// "Manage your trackers…" page header copy.
			await page
				.locator('[data-slot="card-title"]', { hasText: "Preferences" })
				.first()
				.scrollIntoViewIfNeeded();
		},
	},
	{
		name: "dashboard-alert",
		path: "/",
		width: 1400,
		height: 908,
		authenticated: true,
		setup: async (page) => {
			// The banner renders above the dashboard stats. Scope to the
			// shadcn `Alert` data-slot so we don't collide with Sonner toasts
			// (which also use role="alert").
			await page
				.locator('[data-slot="alert"]')
				.first()
				.waitFor({ state: "visible", timeout: 5_000 })
				.catch(() => {
					throw new Error(
						"dashboard-alert shot requested but the BudgetAlertBanner " +
							"is not visible on /. Run SCREENSHOT_FORCE_ALERT=0 or seed " +
							"an over-budget expense first (see CAPTURE.md).",
					);
				});
		},
	},
];

await mkdir(OUT, { recursive: true });

// --- helpers ---------------------------------------------------------------

type BudgetAlertLevel = "ok" | "warning" | "exceeded";
type BudgetAlert = {
	category_id: string;
	category_name: string;
	spent: string;
	limit: string;
	percentage: number;
	level: BudgetAlertLevel;
};
type Preferences = {
	budget_alerts_enabled: boolean;
	weekly_summary_enabled: boolean;
	round_amounts_enabled: boolean;
};

function currentMonth(now = new Date()): string {
	const y = now.getUTCFullYear();
	const m = String(now.getUTCMonth() + 1).padStart(2, "0");
	return `${y}-${m}`;
}

/**
 * Authenticate via the API directly so we can call protected endpoints
 * from the browser context later (page.request shares cookies/storage
 * with the page's context).
 */
async function authToken(api: APIRequestContext): Promise<string> {
	const res = await api.post(`${API_RAW}/auth/login`, {
		data: { email: EMAIL, password: PASSWORD },
	});
	if (!res.ok()) {
		throw new Error(
			`login failed (${res.status()}): ${await res.text()}. ` +
				`Set SCREENSHOT_EMAIL / SCREENSHOT_PASSWORD to a valid dev user.`,
		);
	}
	const body = await res.json();
	return body.access_token as string;
}

/**
 * Read the live preferences row to know whether budget alerts are enabled
 * at all (the FE gates the request on this flag, so a `false` here means
 * the banner will never render regardless of seed data).
 */
async function readPreferences(api: APIRequestContext, token: string): Promise<Preferences> {
	const res = await api.get(`${API_RAW}/preferences`, {
		headers: { Authorization: `Bearer ${token}` },
	});
	if (!res.ok()) {
		throw new Error(
			`GET /preferences failed (${res.status()}). ` +
				`Is the backend up at ${API_RAW}? See docs/screenshots/CAPTURE.md.`,
		);
	}
	return (await res.json()) as Preferences;
}

async function listTrackers(
	api: APIRequestContext,
	token: string,
): Promise<{ id: string; name: string }[]> {
	const res = await api.get(`${API_RAW}/trackers`, {
		headers: { Authorization: `Bearer ${token}` },
	});
	if (!res.ok()) {
		throw new Error(`GET /trackers failed (${res.status()}): ${await res.text()}`);
	}
	return (await res.json()) as { id: string; name: string }[];
}

async function readBudgetAlerts(
	api: APIRequestContext,
	token: string,
	trackerId: string,
	month: string,
): Promise<BudgetAlert[]> {
	const res = await api.get(
		`${API_RAW}/trackers/${trackerId}/budget-alerts?month=${month}`,
		{ headers: { Authorization: `Bearer ${token}` } },
	);
	if (!res.ok()) {
		throw new Error(
			`GET /trackers/${trackerId}/budget-alerts failed (${res.status()}): ${await res.text()}`,
		);
	}
	return (await res.json()) as BudgetAlert[];
}

async function ensureAlertVisible(
	page: Page,
	api: APIRequestContext,
	token: string,
	trackerId: string,
	month: string,
) {
	// The FE only fetches /budget-alerts when prefs.budget_alerts_enabled
	// is true. Flip it on if needed; the optimistic mutation rolls back
	// automatically when the script context closes.
	await page.goto(`${BASE}/settings`, { waitUntil: "domcontentloaded" });
	const prefSwitch = page
		.getByRole("switch", { name: /budget alerts/i })
		.first();
	const isOn = await prefSwitch.isChecked().catch(() => false);
	if (!isOn) {
		await prefSwitch.click();
		// Give TanStack Query a moment to invalidate + refetch
		await page.waitForTimeout(500);
	}

	// Now check the live API. If no category is currently warning/exceeded,
	// we can't capture the banner — surface a helpful message.
	const alerts = await readBudgetAlerts(api, token, trackerId, month);
	const active = alerts.filter((a) => a.level !== "ok");
	if (active.length === 0) {
		throw new Error(
			`No active budget alerts for tracker ${trackerId} in ${month}. ` +
				`Create a budget + an over-limit expense first (see CAPTURE.md → ` +
				`"Capturing the alert banner").`,
		);
	}
	console.log(
		`  alerts active: ${active.map((a) => `${a.category_name}@${a.level}`).join(", ")}`,
	);
}

// --- main ------------------------------------------------------------------

const month = process.env.SCREENSHOT_MONTH ?? currentMonth();
const forceAlert = process.env.SCREENSHOT_FORCE_ALERT === "1";
const explicitTrackerId = process.env.SCREENSHOT_TRACKER_ID;

console.log(`Capturing ${SHOTS.length} screenshots against ${BASE}`);
console.log(`  API:           ${API_RAW}`);
console.log(`  Output:        ${OUT}`);
console.log(`  Month:         ${month}`);
console.log(`  Force alert:   ${forceAlert}`);

const browser = await chromium.launch();
try {
	// 1. API probe (no browser UI needed for the preflight)
	const probeCtx = await browser.newContext();
	const probeApi = probeCtx.request;
	const token = await authToken(probeApi);
	const prefs = await readPreferences(probeApi, token);
	console.log(
		`  Preferences:   budget_alerts=${prefs.budget_alerts_enabled}, ` +
			`weekly_summary=${prefs.weekly_summary_enabled}, ` +
			`round_amounts=${prefs.round_amounts_enabled}`,
	);

	const trackers = await listTrackers(probeApi, token);
	if (trackers.length === 0) {
		throw new Error(
			"No trackers found for this user — create one via /trackers or the FE " +
				"before running the capture.",
		);
	}
	const trackerId = explicitTrackerId ?? trackers[0].id;
	console.log(`  Tracker:       ${trackerId} (${trackers[0].name})`);

	// Decide whether we'll attempt the alert frame.
	let captureAlert = forceAlert;
	if (!captureAlert && prefs.budget_alerts_enabled) {
		const alerts = await readBudgetAlerts(probeApi, token, trackerId, month);
		const active = alerts.filter((a) => a.level !== "ok");
		captureAlert = active.length > 0;
		if (captureAlert) {
			console.log(
				`  Alert frame:   enabled (${active.length} active alert(s))`,
			);
		} else {
			console.log(
				`  Alert frame:   skipped (no active alerts; set SCREENSHOT_FORCE_ALERT=1 to override)`,
			);
		}
	} else if (!prefs.budget_alerts_enabled) {
		console.log(
			`  Alert frame:   skipped (preferences.budget_alerts_enabled is false; ` +
				`set SCREENSHOT_FORCE_ALERT=1 to flip it on for the capture)`,
		);
	}
	await probeCtx.close();

	// 2. Authenticated capture
	const ctx = await browser.newContext({
		viewport: { width: 1400, height: 900 },
		colorScheme: "dark",
	});
	const page = await ctx.newPage();

	console.log(`→ signing in as ${EMAIL}`);
	await page.goto(`${BASE}/sign-in`, { waitUntil: "domcontentloaded" });
	await page.getByLabel(/email/i).fill(EMAIL);
	await page.getByLabel(/password/i).fill(PASSWORD);
	await Promise.all([
		page.waitForURL(`${BASE}/`, { timeout: 15_000 }),
		page.getByRole("button", { name: /sign in/i }).click(),
	]);

	for (const shot of SHOTS) {
		if (shot.name === "sign-in" || shot.name === "sign-up") continue;
		if (shot.name === "dashboard-alert" && !captureAlert) continue;

		if (shot.name === "dashboard-alert") {
			// Make sure the FE has the banner toggled on AND that
			// /budget-alerts returns non-empty for the current month.
			await ensureAlertVisible(page, ctx.request, token, trackerId, month);
		}

		await page.setViewportSize({ width: shot.width, height: shot.height });
		await page.goto(`${BASE}${shot.path}`, { waitUntil: "domcontentloaded" });
		if (shot.authenticated) {
			// The brand "Spendrift" in the sidebar only renders after the
			// SPA finishes hydration — wait for it before screenshotting.
			await page.getByText("Spendrift", { exact: true }).first().waitFor();
		}
		await shot.setup?.(page);
		await page.screenshot({
			path: join(OUT, `${shot.name}.png`),
			fullPage: shot.fullPage ?? false,
		});
		console.log(`  ✓ ${shot.name}.png`);
	}
	await ctx.close();

	// 3. Anon capture for the auth screens (drop cookies)
	const anonCtx = await browser.newContext({
		viewport: { width: 1400, height: 900 },
		colorScheme: "dark",
	});
	const anonPage = await anonCtx.newPage();
	for (const shot of SHOTS) {
		if (shot.name !== "sign-in" && shot.name !== "sign-up") continue;
		await anonPage.setViewportSize({ width: shot.width, height: shot.height });
		await anonPage.goto(`${BASE}${shot.path}`, { waitUntil: "domcontentloaded" });
		await shot.setup?.(anonPage);
		await anonPage.screenshot({
			path: join(OUT, `${shot.name}.png`),
			fullPage: shot.fullPage ?? false,
		});
		console.log(`  ✓ ${shot.name}.png (anon)`);
	}
	await anonCtx.close();

	console.log("Done.");
} finally {
	await browser.close();
}