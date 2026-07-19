// One-off: make sure the most recent expense on the demo tracker is dated
// ≥ 2 days ago so the dashboard catch-up banner shows in screenshots.

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

function isoDate(offsetDays) {
	const d = new Date();
	d.setUTCDate(d.getUTCDate() + offsetDays);
	return d.toISOString().slice(0, 10);
}

const login = await fetch(`${BASE}/auth/login`, {
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
const token = (await login.json()).access_token;

const trackers = await api(token, "/trackers");
const tracker = trackers.find((t) => t.name === "Demo USD") ?? trackers[0];
const todayExpenses = await api(token, `/trackers/${tracker.id}/expenses?date_from=${isoDate(0)}&date_to=${isoDate(0)}`);
for (const e of todayExpenses) {
	await api(token, `/trackers/${tracker.id}/expenses/${e.id}`, { method: "DELETE" });
	console.log(`  deleted today entry: ${e.description}`);
}

// Add a fresh "old" entry 3 days ago to guarantee the most recent row is old.
const cats = await api(token, `/trackers/${tracker.id}/categories`);
const groceries = cats.find((c) => c.name === "Groceries") ?? cats[0];
await api(token, `/trackers/${tracker.id}/expenses`, {
	method: "POST",
	body: JSON.stringify({
		amount: "45.00",
		description: "coffee (recent old)",
		type: "want",
		category_id: groceries.id,
		date: isoDate(-3),
	}),
});
console.log("✓ newest expense is now 3 days old");
