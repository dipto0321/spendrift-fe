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

The repo ships `playwright` as a devDependency and a script alias. One-time
setup, then capture:

```bash
pnpm capture:screenshots:install   # downloads chromium (~150 MB)
pnpm capture:screenshots           # walks every route, writes PNGs
```

The script (`scripts/capture-screenshots.ts`) signs in against the running
dev server and writes PNGs to `docs/screenshots/`. It expects:

| Env var | Default | Notes |
|---|---|---|
| `SCREENSHOT_BASE` | `http://localhost:3000` | Frontend dev URL. |
| `SCREENSHOT_EMAIL` / `SCREENSHOT_PASSWORD` | `demo@example.com` / `demopass` | Login credentials. |
| `SCREENSHOT_API_BASE` | *(unused, FE reads `VITE_API_BASE_URL`)* | — |

> **Backend in Docker?** No special handling needed — as long as the FE can
> reach the API at the URL in `VITE_API_BASE_URL`, Playwright talks to it
> the same way the browser would. `localhost:8000` works for both
> `docker run -p 8000:8000` and `docker compose up` against the host
> network; use `host.docker.internal:8000` only if the FE were running
> inside a container too (it isn't here).

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