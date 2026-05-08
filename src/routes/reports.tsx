import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/reports")({
	component: ReportsPage,
});

function ReportsPage() {
	return (
		<main className="page-wrap px-4 pb-14 pt-10 sm:pt-12">
			<header className="mb-6">
				<p className="island-kicker mb-2">Reports</p>
				<h1 className="display-title m-0 text-3xl font-semibold text-[var(--sea-ink)] sm:text-5xl">
					Reports overview
				</h1>
				<p className="m-0 mt-2 max-w-2xl text-sm leading-6 text-[var(--sea-ink-soft)] sm:text-base">
					Use this space for charts, exportable summaries, and trends.
				</p>
			</header>
		</main>
	);
}
