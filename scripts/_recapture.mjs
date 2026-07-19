// One-off: re-capture a single screenshot by name (e.g. after fixing
// animation timing).
//
//   node scripts/_recapture.mjs <shot-name> [path]
//
// If `path` is provided it's used instead of the conventional route
// (useful for the bulk / smart-paste / catch-up shots which need setup).

import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const EMAIL = "demo@example.com";
const PASSWORD = "Demo@1234";
const OUT = "docs/screenshots";

const SHOT_TO_PATH = {
	dashboard: "/",
	expenses: "/expenses",
	"expenses-bulk": "/expenses",
	"expenses-smart-paste": "/expenses",
	budget: "/budget",
	reports: "/reports",
	settings: "/settings",
	"dashboard-alert": "/",
	"dashboard-catch-up": "/",
};

const name = process.argv[2];
if (!name) {
	console.error("usage: node scripts/_recapture.mjs <shot-name> [path]");
	process.exit(1);
}
const path = process.argv[3] ?? SHOT_TO_PATH[name];
if (!path) {
	console.error(`unknown shot: ${name}`);
	process.exit(1);
}

const browser = await chromium.launch();
try {
	const ctx = await browser.newContext({
		viewport: { width: 1400, height: 908 },
		colorScheme: "dark",
	});
	const page = await ctx.newPage();
	await page.goto(`${BASE}/sign-in`, { waitUntil: "domcontentloaded" });
	await page.getByLabel(/email/i).fill(EMAIL);
	await page.getByLabel(/password/i).fill(PASSWORD);
	await Promise.all([
		page.waitForURL(`${BASE}/`, { timeout: 15_000 }),
		page.getByRole("button", { name: /sign in/i }).click(),
	]);

	await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
	await page.getByText("Spendrift", { exact: true }).first().waitFor();
	await page.locator('[data-slot="card-title"]').first().waitFor({ timeout: 15_000 });
	// Reports uses Recharts — needs longer settle for chart animation.
	const settleMs = name === "reports" ? 1500 : 500;
	await page.waitForTimeout(settleMs);

	const out = `${OUT}/${name}.png`;
	await page.screenshot({ path: out, fullPage: name === "reports" });
	console.log(`✓ ${out}`);
} finally {
	await browser.close();
}
