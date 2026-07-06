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
 *   SCREENSHOT_PASSWORD=demopass
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page } from "playwright";

const BASE = process.env.SCREENSHOT_BASE ?? "http://localhost:3000";
const EMAIL = process.env.SCREENSHOT_EMAIL ?? "demo@example.com";
const PASSWORD = process.env.SCREENSHOT_PASSWORD ?? "demopass";
const OUT = join(process.cwd(), "docs", "screenshots");

type Shot = {
	name: string;
	path: string;
	width: number;
	height: number;
	fullPage?: boolean;
	setup?: (page: Page) => Promise<void>;
};

const SHOTS: Shot[] = [
	{ name: "sign-in", path: "/sign-in", width: 1400, height: 900 },
	{ name: "sign-up", path: "/sign-up", width: 1400, height: 900 },
	{
		name: "dashboard",
		path: "/",
		width: 1400,
		height: 908,
		setup: async (page) => {
			// Wait for the page header to settle so the banner slot
			// (when present) renders before the snapshot.
			await page.waitForSelector("main");
			await page.waitForLoadState("networkidle");
		},
	},
	{ name: "expenses", path: "/expenses", width: 1400, height: 908 },
	{ name: "budget", path: "/budget", width: 1400, height: 908 },
	{ name: "reports", path: "/reports", width: 1400, height: 1347, fullPage: true },
	{
		name: "settings",
		path: "/settings",
		width: 1400,
		height: 1100,
		setup: async (page) => {
			// Scroll the Preferences card into view so it lands in the
			// viewport-sized crop.
			await page.getByText("Preferences").scrollIntoViewIfNeeded();
		},
	},
];

await mkdir(OUT, { recursive: true });

console.log(`Capturing ${SHOTS.length} screenshots against ${BASE}`);
console.log(`  → ${OUT}`);

const browser = await chromium.launch();
try {
	const ctx = await browser.newContext({
		viewport: { width: 1400, height: 900 },
		colorScheme: "dark",
	});
	const page = await ctx.newPage();

	// --- sign-in ---
	console.log("→ sign-in page (no auth required)");
	await page.goto(`${BASE}/sign-in`, { waitUntil: "networkidle" });

	// Authenticated screenshots: sign in first, then walk every route.
	console.log(`→ signing in as ${EMAIL}`);
	await page.getByLabel(/email/i).fill(EMAIL);
	await page.getByLabel(/password/i).fill(PASSWORD);
	await Promise.all([
		page.waitForURL(`${BASE}/`, { timeout: 15_000 }),
		page.getByRole("button", { name: /sign in/i }).click(),
	]);

	for (const shot of SHOTS) {
		if (shot.name === "sign-in" || shot.name === "sign-up") continue; // already captured
		await page.setViewportSize({ width: shot.width, height: shot.height });
		await page.goto(`${BASE}${shot.path}`, { waitUntil: "networkidle" });
		await shot.setup?.(page);
		await page.screenshot({
			path: join(OUT, `${shot.name}.png`),
			fullPage: shot.fullPage ?? false,
		});
		console.log(`  ✓ ${shot.name}.png`);
	}

	// --- sign-in & sign-up: capture pre-auth (open a fresh context to drop cookies) ---
	const anonCtx = await browser.newContext({
		viewport: { width: 1400, height: 900 },
		colorScheme: "dark",
	});
	const anonPage = await anonCtx.newPage();
	for (const shot of SHOTS) {
		if (shot.name !== "sign-in" && shot.name !== "sign-up") continue;
		await anonPage.setViewportSize({ width: shot.width, height: shot.height });
		await anonPage.goto(`${BASE}${shot.path}`, { waitUntil: "networkidle" });
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