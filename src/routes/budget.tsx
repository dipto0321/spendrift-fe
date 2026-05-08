import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/budget")({
	component: BudgetPage,
});

function BudgetPage() {
	return (
		<main className="page-wrap px-4 pb-14 pt-10 sm:pt-12">
			<header className="mb-6">
				<p className="island-kicker mb-2">Budget</p>
				<h1 className="display-title m-0 text-3xl font-semibold text-[var(--sea-ink)] sm:text-5xl">
					Budget workspace
				</h1>
				<p className="m-0 mt-2 max-w-2xl text-sm leading-6 text-[var(--sea-ink-soft)] sm:text-base">
					This section is ready for budget rules, caps, and alerts.
				</p>
			</header>
		</main>
	);
}
