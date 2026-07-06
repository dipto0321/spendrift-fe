# SPEC

## §G GOAL
tracker-based personal finance web app (Spendrift). ∀ tracker → own currency, own expenses/categories/budget/reports. real API-backed (no mock data).

## §C CONSTRAINTS
- stack ! TanStack Start + React 19 + TypeScript + TailwindCSS 4 + ShadCN UI + TanStack Query/Router/Store
- forms: react-hook-form + zod
- charts: recharts via ShadCN chart wrapper only, ⊥ custom chart libs
- arch ! feature-based DDD: `features/<name>/{data,domain,presentation}`
- data flow ! pages/hooks → `data/repository.ts` (single swap seam), ⊥ direct `fetch`
- money/naming mapped @ `data/dto.ts` boundary: snake_case ↔ camelCase, decimal-string ↔ `number`
- API base `VITE_API_BASE_URL` (env.ts, t3-oss/env-core), FastAPI backend, `HTTPBearer` only, ⊥ cookie auth
- auth tokens ! localStorage (`shared/api/tokens.ts`) — documented XSS tradeoff, ⊥ SSR-readable
- lint/format ! biome (`biome.json` via `check`/`lint`/`format` scripts)
- tests ! vitest, domain services only (pure fns), ⊥ integration/e2e yet
- i18n scaffold (`paraglide`) present, ⊥ fully wired into UI copy
- observability: Sentry (`@sentry/tanstackstart-react`) + PostHog wired

## §I INTERFACES
- ui routes: `/` dashboard, `/expenses`, `/budget`, `/reports`, `/profile`, `/settings`, `/ai` (blurred "coming soon" shield, V9), `/sign-in`, `/sign-up`
- api: `POST /auth/login` → tokens (skipAuth)
- api: `POST /auth/register` → tokens (skipAuth)
- api: `POST /auth/sign-out` {refresh_token} (best-effort)
- api: `POST /auth/refresh` {refresh_token} → {access_token, refresh_token} (skipAuth, single-flight)
- api: `GET /users/me` → user
- api: `PATCH /users/me` {name,email} → user
- api: `PATCH /users/me/password` {current_password,new_password} → user
- api: `POST|DELETE /users/me/avatar` (multipart on POST) → user
- api: `GET|POST /trackers`, `GET|PATCH|DELETE /trackers/:id`
- api: `GET|POST /trackers/:id/categories`, `GET|PATCH|DELETE /trackers/:id/categories/:id`
- api: `GET|POST /trackers/:id/expenses` (query filters via `toExpenseQuery`), `GET|PATCH|DELETE /trackers/:id/expenses/:id`
- api: `GET|POST /trackers/:id/budgets`, `GET|PATCH|DELETE /trackers/:id/budgets/:id`, `GET /trackers/:id/budgets/:id/status`
- api: `GET /trackers/:id/budget-alerts?month=YYYY-MM` → `BudgetAlert[]` (level: `ok|warning|exceeded`)
- api: `GET /trackers/:id/dashboard?month=YYYY-MM`
- api: `GET /trackers/:id/reports/{summary,spending,category-breakdown,needs-vs-wants,year-comparison}`
- api: `GET|PUT /preferences` → `Preferences { budgetAlerts, weeklySummary, roundAmounts }`
- storage: localStorage `spendrift.last-tracker` (last active tracker id, client-only convenience)
- storage: localStorage access/refresh tokens (`shared/api/tokens.ts`)
- env: `VITE_API_BASE_URL`, `VITE_SENTRY_{DSN,ORG,PROJECT}`, `SENTRY_AUTH_TOKEN`, `SENTRY_ENVIRONMENT`

## §V INVARIANTS
V1: ∀ feature data access → thru `data/repository.ts`, ⊥ direct fetch in pages/hooks
V2: ∀ 401 (except `skipAuth` calls) & refresh token present → 1 refresh attempt → retry orig req once
V3: concurrent 401s ∴ ≤ 1 `/auth/refresh` call in flight (single-flight promise)
V4: refresh ultimately fails → drop session (`onAuthExpired`) → router → `/sign-in`
V5: `requireAuth()`/`redirectIfAuthed()` run client-only (`isBrowser()` guard) — backend has ⊥ cookie auth, SSR gate deferred
V6: ∀ tracker-scoped resource (expenses/categories/budgets/dashboard/reports) ! keyed by `trackerId` in path
V7: category delete w/ existing expenses → API 409s ∴ reassign expenses → "Uncategorized" category (matched by name, ⊥ literal id) first, then delete
V8: budgets: ≤ 1 budget per tracker per current month (backend enforces, 400 on dup); edit ! update existing, ⊥ create second; ⊥ delete; past months read-only. month ! chosen via global topbar `MonthContext` (`shared/ui/MonthContext.tsx`), ⊥ per-form picker
V9: `/ai` route → content behind "coming soon" blur shield, feature ⊥ implemented
V10: expense form: amount `>` 0 & numeric; category, date, description ! non-empty
V11: budget form: monthlyLimit `>` 0, savingsTarget `≥` 0, savingsTarget `≤` monthlyLimit
V12: sign-out best-effort: local session cleared even if `/auth/sign-out` call fails
V13: access token present & ⊥ cached user → `bootstrap()` fetches `/users/me` once/session (in-flight guarded)
V14: money crosses dto boundary as decimal-string ↔ `number`, keys snake_case ↔ camelCase — nowhere else in app
V15: ∀ route ∈ `MONTH_PAGES` (`routes/__root.tsx`) ! consume `useMonth().selectedMonth` for its data query — see B1
V16: preferences (Budget alerts / Weekly summary / Round amounts) ! read via `usePreferences()`, mutations via `useUpdatePreferences()` (optimistic, rollback on error); ⊥ direct `apiFetch(/preferences)` in pages
V17: money rendering ! threaded thru `useFormatCurrency()` so the `roundAmounts` preference applies app-wide; raw `formatCurrency()` only acceptable in tests / non-UI utilities

## §T TASKS
id|status|task|cites
T1|x|foundation: api client, token refresh, env wiring|V1,V2,V3
T2|x|auth: login/register/sign-out/me, session snapshot|V4,V12,V13
T3|x|trackers CRUD + last-active persistence|V6,I.trackers
T4|x|categories + expenses CRUD, uncategorized reassign on delete|V7,V10
T5|x|budgets CRUD + status, one-per-month rule|V8,V11
T6|x|dashboard: real current-month data|I.dashboard
T7|x|reports: summary/spending/category-breakdown/needs-vs-wants/year-comparison|I.reports
T8|x|cleanup: remove all mock data + stale copy|-
T9|.|profile/password/avatar: plan locked "⊥ avail yet" (no endpoints), code now calls real endpoints ∴ confirm backend support|I.users
T10|.|SSR auth gate: revisit httpOnly-cookie option, re-enable server `beforeLoad` guard|V5
T11|.|expense filtering: move server-side (currently client-side; `toExpenseQuery` ready)|-
T12|.|wire paraglide i18n into UI copy|-
T13|~|AI settings: page built (`routes/ai.tsx`, config form, feature toggles, localStorage), gated behind "coming soon" shield ∴ real AI wiring still pending|V9
T14|x|design migration: v0 palette + design-token pass, all 10 phases of `Design_Migration_Plan.md` shipped on `feat/design-migration`|-
T15|.|per-category budgets: `ReportsPage.tsx` even-splits tracker's monthly limit across categories (`monthlyLimit / catBudgetData.length`) ∴ replace w/ real backend per-category budget data when available|-
T16|.|delete dead `features/expenses/presentation/CategoryColorPicker.tsx` — 0 imports, superseded by `shared/ui/ColorPicker.tsx`|-
T17|x|fix B1: wire dashboard to `selectedMonth` (`DashboardPage.tsx` + `dashboardRepository.getSummary(month)` + `useDashboard(trackerId, month)`)|V15,B1
T18|x|server-backed user preferences: `features/preferences/{data,domain,presentation}` reads/writes `/preferences`; replaces prior localStorage stub — UI flag now persists per user|V16,V17
T19|x|budget alerts banner: `BudgetAlertBanner` on `/` lists warning/exceeded categories for `useMonth().selectedMonth`, gated on `preferences.budgetAlerts` so the request is skipped when disabled|I.budget-alerts,V16

## §B BUGS
id|date|cause|fix
B1|2026-07-05|`routes/__root.tsx` `MONTH_PAGES` shows month selector on `/` but `DashboardPage.tsx` never reads `useMonth()`; `dashboardRepository.getSummary()` always hits current-month-only `/dashboard`|V15
B1.fix|2026-07-06|DashboardPage now consumes `useMonth().selectedMonth` and forwards it to `useDashboard(trackerId, month)` → `dashboardRepository.getSummary(trackerId, month)`. `dashboardKeys.summary` includes `month` so cached entries invalidate per-month.
