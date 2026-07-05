# Screenshot capture guide

This is the recipe for re-capturing the screenshots under `docs/screenshots/`
so they stay in sync with the running app. The original PNGs are
1400×908 (auth pages are 1400×900, reports is taller at 1400×1347).

The UI ships dark-mode first; the existing screenshots are dark.

---

## What changed in this batch

The previous batch captured the pre-preferences app. The new screens you
need to (re)capture:

| File | Page | Why it changed |
|---|---|---|
| `dashboard.png` | `/` | New `BudgetAlertBanner` may render at the top when categories cross threshold; month selector now drives the data |
| `settings.png` *(new)* | `/settings` | New `Preferences` card with three server-backed toggles (Budget alerts, Weekly summary, Round amounts) — supersedes the localStorage version |
| `budget.png` | `/budget` | Layout unchanged in this batch, but the formatter flows through `useFormatCurrency()` — only matters if Round amounts is on |
| `expenses.png` | `/expenses` | Same — formatter change is conditional on the Round amounts toggle |
| `reports.png` | `/reports` | Same — formatter change is conditional on the Round amounts toggle |
| `sign-in.png` / `sign-up.png` | auth | Unchanged |

---

## How to capture

### Option A — Manual (matches the original capture)

1. `pnpm dev` (port 3000) and `uvicorn … :8000` (or equivalent) running.
2. Open the page in a Chromium-based browser, set the viewport to
   **1400×908** (or 1400×900 / 1400×1347 where noted), and use the
   browser's *Capture full size screenshot* / DevTools screenshot.
3. Toggle dark mode (the existing screenshots are dark).
4. Save into `docs/screenshots/`, overwriting in place.

### Option B — Playwright (recommended, deterministic)

```bash
pnpm dlx playwright install chromium
pnpm dlx tsx scripts/capture-screenshots.ts
```

`scripts/capture-screenshots.ts` (template below) signs in, navigates to
each route at the correct viewport, and writes the PNGs.

> **Auth note:** the script needs a working dev login. Either seed a
> fixture user, or expose a dev-only auth bypass behind `import.meta.env.DEV`.
> The script below uses email/password from env vars.

```ts
// scripts/capture-screenshots.ts
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const BASE = process.env.SCREENSHOT_BASE ?? "http://localhost:3000";
const EMAIL = process.env.SCREENSHOT_EMAIL ?? "demo@example.com";
const PASSWORD = process.env.SCREENSHOT_PASSWORD ?? "demopass";
const OUT = join(process.cwd(), "docs/screenshots");

type Shot = { name: string; path: string; width: number; height: number; setup?: (page: import("playwright").Page) => Promise<void> };

const SHOTS: Shot[] = [
  { name: "sign-in",  path: "/sign-in",  width: 1400, height: 900 },
  { name: "sign-up",  path: "/sign-up",  width: 1400, height: 900 },
  { name: "dashboard",path: "/",         width: 1400, height: 908,
    setup: async (page) => {
      // Pick a past month so the BudgetAlertBanner is *likely* empty
      // (or, to force a visible banner, run with a seed that has a
      // category over its limit — see scripts/seed-alert.ts).
      await page.getByRole("combobox", { name: /month/i }).selectOption({ label: /2026-06/i });
    } },
  { name: "expenses", path: "/expenses", width: 1400, height: 908 },
  { name: "budget",   path: "/budget",   width: 1400, height: 908 },
  { name: "reports",  path: "/reports",  width: 1400, height: 1347 },
  { name: "settings", path: "/settings", width: 1400, height: 1100,
    setup: async (page) => {
      // Scroll to the Preferences card so the banner shot makes sense.
      await page.getByText("Preferences").scrollIntoViewIfNeeded();
    } },
];

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

await page.goto(`${BASE}/sign-in`, { waitUntil: "networkidle" });
await page.getByLabel(/email/i).fill(EMAIL);
await page.getByLabel(/password/i).fill(PASSWORD);
await page.getByRole("button", { name: /sign in/i }).click();
await page.waitForURL(`${BASE}/`);

for (const shot of SHOTS) {
  await page.setViewportSize({ width: shot.width, height: shot.height });
  await page.goto(`${BASE}${shot.path}`, { waitUntil: "networkidle" });
  await shot.setup?.(page);
  await page.screenshot({
    path: join(OUT, `${shot.name}.png`),
    fullPage: false, // set true to capture beyond the fold (matches prior full-page reports.png)
  });
  console.log(`captured ${shot.name}.png`);
}

await browser.close();
```

### Capturing the alert banner

If you want the banner visible in `dashboard.png`, the cleanest path is
to run a one-off backend seed that pushes one category over its limit
for the current month:

```bash
curl -X POST localhost:8000/api/v1/trackers/$TID/expenses \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"amount":"9999","category_id":"<cat>","date":"2026-07-06","type":"want","description":"seed"}'
```

Then snapshot the dashboard with the alert banner rendered.

---

## After capturing

Run the diff to be sure nothing else slipped in:

```bash
git status
git diff --stat docs/screenshots/
```

Commit the new PNGs in a single commit so the README/SPEC callouts
(`settings.png`, banner callouts) and the images land together.