---
name: run-app
description: Launch the Spendrift frontend (pnpm dev) and drive it in a headless browser to screenshot real screens. Use when asked to run, preview, or screenshot the app, or to verify UI/design changes. Covers the mock-auth sign-up (incl. the math human-check), tracker onboarding, and the Playwright recipe.
---

# Running & screenshotting the Spendrift frontend

This is a TanStack Start (SSR) app. "Running it" means the dev server +
a headless browser, because every meaningful screen is behind a
localStorage-based mock auth gate.

## 1. Dev server

```bash
pnpm dev > /tmp/spendrift-dev.log 2>&1 &
# macOS has no `timeout`; poll with curl --retry instead of sleep
curl -s --retry 40 --retry-delay 1 --retry-connrefused -o /dev/null -w "%{http_code}\n" http://localhost:3000/sign-in
# stop before relaunching:  pkill -f "vite dev"
```

Port 3000. `.env.local` is loaded automatically by the dev script.

## 2. Auth & onboarding gate (important)

There is no backend — auth and onboarding live in the browser:

- **Sign-up** (`/sign-up`) writes the user to `localStorage`
  (`spendrift.mock-auth.*`). The form has a **math human-check**: a span
  reads `"<a> <op> <b> = ?"` — read it, compute, and fill `#human-check`,
  or sign-up silently fails and you stay on the page.
- **Onboarding** then asks for the first tracker: `#tracker-name` +
  `#tracker-currency` (≤3 chars) → button "Create tracker".
- Trackers live in **in-memory** repo state (not localStorage), so you
  must go through onboarding each fresh browser context — you cannot
  pre-seed a tracker via localStorage.
- After onboarding you land on the dashboard; the active tracker is a
  `?tracker=<uuid>` search param (retained across nav).

Theme: a `dark` class on `<html>` (see `ThemeToggle`); default is light.
Toggle via the sidebar button `aria-label^="Theme"`, or force it with
`localStorage.theme` + `document.documentElement.classList`.

## 3. Screenshot recipe (Python Playwright)

Use the anaconda Python Playwright (`/opt/anaconda3/bin/python`) — the
`playwright` on PATH is Python, not node; chromium browsers are cached.

```python
import re
from playwright.sync_api import sync_playwright

def solve(t):  # "7 + 3 = ?"
    a, op, b = re.search(r"(\d+)\s*([+\-−×x*/])\s*(\d+)", t).groups()
    a, b = int(a), int(b)
    return a + b if op == "+" else a - b if op in "-−" else a // b if op == "/" else a * b

with sync_playwright() as p:
    pg = p.chromium.launch(headless=True).new_page(
        viewport={"width": 1440, "height": 1000}, device_scale_factor=2)
    pg.goto("http://localhost:3000/sign-up", wait_until="domcontentloaded")
    pg.fill('input[placeholder="Your full name"]', "Dipto")
    pg.fill('input[placeholder="name@domain.com"]', "test@test.com")
    pg.fill('input[placeholder="Create a password"]', "password123")
    pg.fill('input[placeholder="Repeat password"]', "password123")
    pg.fill('#human-check', str(solve(pg.get_by_text(re.compile(r"= \?")).first.inner_text())))
    pg.get_by_role("button", name="Create account").click()
    pg.wait_for_selector('#tracker-name', timeout=20000)
    pg.fill('#tracker-name', "Bangladesh"); pg.fill('#tracker-currency', "BDT")
    pg.get_by_role("button", name="Create tracker").click()
    pg.wait_for_selector('text=Spendrift overview', timeout=20000)
    pg.wait_for_timeout(1200)  # let the rise-in entrance settle
    pg.screenshot(path="/tmp/spendrift-shots/dashboard-light.png", full_page=True)
    pg.click('button[aria-label^="Theme"]'); pg.wait_for_timeout(900)
    pg.screenshot(path="/tmp/spendrift-shots/dashboard-dark.png", full_page=True)
```

Read the PNGs back to actually look at them. For auth screens alone (no
gate), just `goto` `/sign-in` and screenshot; force dark via
`localStorage.setItem('theme','dark')` + add the `dark` class, no toggle
button exists outside the workspace.

## Gotchas
- `timeout` is absent on macOS — poll with `curl --retry`.
- Use `domcontentloaded` + explicit `wait_for_selector`; `networkidle`
  can hang on dev websockets.
- Mock mutations have artificial delays (~120–260ms) — wait for the
  resulting selector, don't race it.
