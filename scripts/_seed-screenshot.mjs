// One-off seed for screenshot capture. Runs against the live backend at
// localhost:8000 (routed via VITE_API_BASE_URL). Idempotent — re-running
// reuses the demo@example.com account and adds expenses.

import { chromium } from "playwright";

const BASE = "http://localhost:8000/api/v1";
const EMAIL = "demo@example.com";
const PASSWORD = "Demo@1234";

async function api(token, path, init = {}) {
	const response = await fetch(`${BASE}${path}`, {
		...init,
		headers: {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...init.headers,
		},
	});
	const text = await response.text();
	if (!response.ok) throw new Error(`${init.method ?? "GET"} ${path} -> ${response.status}: ${text}`);
	return text ? JSON.parse(text) : null;
}

async function loginOrRegister() {
	const reg = await fetch(`${BASE}/auth/register`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: "Demo User" }),
	});
	const regBody = reg.ok ? await reg.json() : null;
	const token = regBody?.access_token;
	if (token) return token;

	const login = await fetch(`${BASE}/auth/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
	});
	if (!login.ok) throw new Error(`login failed: ${login.status} ${await login.text()}`);
	return (await login.json()).access_token;
}

function isoDate(offsetDays) {
	const d = new Date();
	d.setUTCDate(d.getUTCDate() + offsetDays);
	return d.toISOString().slice(0, 10);
}

const token = await loginOrRegister();
console.log("✓ auth");

let trackers = await api(token, "/trackers");
let tracker = trackers.find((t) => t.name === "Demo USD") ?? trackers[0];
if (!tracker) {
	tracker = await api(token, "/trackers", {
		method: "POST",
		body: JSON.stringify({ name: "Demo USD", currency: "USD" }),
	});
}
console.log(`✓ tracker ${tracker.id} (${tracker.name})`);

let cats = await api(token, `/trackers/${tracker.id}/categories`);
function findCat(name) {
	return cats.find((c) => c.name === name);
}
async function ensureCat(name, color) {
	const existing = findCat(name);
	if (existing) return existing;
	const created = await api(token, `/trackers/${tracker.id}/categories`, {
		method: "POST",
		body: JSON.stringify({ name, color }),
	});
	cats = [...cats, created];
	return created;
}
const food = await ensureCat("Food", "#34d399");
const transport = await ensureCat("Transport", "#60a5fa");
const groceries = await ensureCat("Groceries", "#fbbf24");
console.log("✓ categories");

async function addExpense({ amount, description, type, categoryId, date }) {
	return api(token, `/trackers/${tracker.id}/expenses`, {
		method: "POST",
		body: JSON.stringify({ amount, description, type, category_id: categoryId, date }),
	});
}

const today = isoDate(0);
await addExpense({ amount: "12.50", description: "coffee", type: "want", categoryId: food.id, date: today });
await addExpense({ amount: "40.00", description: "bus ride", type: "need", categoryId: transport.id, date: today });
await addExpense({ amount: "350.00", description: "lunch with team", type: "want", categoryId: food.id, date: today });
await addExpense({ amount: "85.00", description: "groceries run", type: "need", categoryId: groceries.id, date: today });
console.log("✓ today's expenses");

await addExpense({
	amount: "120.00",
	description: "old grocery run",
	type: "want",
	categoryId: groceries.id,
	date: isoDate(-3),
});
console.log("✓ 3-day-old expense (catch-up nudge)");

for (let i = 1; i <= 14; i++) {
	const amounts = [22, 35, 18, 60, 42, 75, 28, 50, 33, 95, 110, 47, 88, 25];
	await addExpense({
		amount: `${amounts[i - 1]}.00`,
		description: `historical item ${i}`,
		type: i % 2 ? "need" : "want",
		categoryId: i % 3 === 0 ? groceries.id : i % 2 === 0 ? transport.id : food.id,
		date: isoDate(-i - 3),
	});
}
console.log("✓ historical expenses");

const month = isoDate(0).slice(0, 7);
const existingBudget = await api(token, `/trackers/${tracker.id}/budgets?month=${month}`);
if (!existingBudget.length) {
	await api(token, `/trackers/${tracker.id}/budgets`, {
		method: "POST",
		body: JSON.stringify({ name: `Budget ${month}`, month, monthly_limit: "1500.00", savings_target: "200.00" }),
	});
	console.log("✓ budget created");
} else {
	console.log("✓ budget already exists");
}

await api(token, "/preferences", {
	method: "PUT",
	body: JSON.stringify({
		budget_alerts_enabled: true,
		weekly_summary_enabled: false,
		round_amounts_enabled: false,
	}),
});
console.log("✓ preferences");

console.log(`Done. SCREENSHOT_TRACKER_ID=${tracker.id}`);
