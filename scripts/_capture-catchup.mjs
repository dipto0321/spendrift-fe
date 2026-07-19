// One-off capture for the dashboard catch-up banner. Run AFTER
// `_ensure-catchup.mjs` (which makes the newest expense ≥ 2 days old).
//
//   node scripts/_ensure-catchup.mjs
//   node scripts/_capture-catchup.mjs
//
// Closes the browser even on failure so the dev server isn't held open.

import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const API_BASE = "http://localhost:8000/api/v1";
const EMAIL = "demo@example.com";
const PASSWORD = "Demo@1234";
const OUT = "docs/screenshots";

const browser = await chromium.launch();
try {
	const ctx = await browser.newContext({
		viewport: { width: 1400, height: 908 },
		colorScheme: "dark",
	});
	const page = await ctx.newPage();

	// Sign in.
	await page.goto(`${BASE}/sign-in`, { waitUntil: "domcontentloaded" });
	await page.getByLabel(/email/i).fill(EMAIL);
	await page.getByLabel(/password/i).fill(PASSWORD);
	await Promise.all([
		page.waitForURL(`${BASE}/`, { timeout: 15_000 }),
		page.getByRole("button", { name: /sign in/i }).click(),
	]);

	// Wait for sidebar brand → SPA hydrated.
	await page.getByText("Spendrift", { exact: true }).first().waitFor();
	// Wait for the dashboard summary to render.
	await page.locator('[data-slot="card-title"]').first().waitFor({ timeout: 15_000 });
	// Then wait specifically for the Catch up link. (It's rendered as an
	// `<a>` via `<Button asChild><Link>`, so use the link role.)
	await page
		.getByRole("link", { name: /catch up/i })
		.waitFor({ state: "visible", timeout: 5_000 })
		.catch(() => {
			throw new Error(
				"Catch-up nudge not visible on / — make sure you ran _ensure-catchup.mjs first.",
			);
		});
	await page.waitForTimeout(500);

	await page.screenshot({ path: `${OUT}/dashboard-catch-up.png`, fullPage: false });
	console.log(`✓ ${OUT}/dashboard-catch-up.png`);
} finally {
	await browser.close();
}
