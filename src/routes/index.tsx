import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: App });

function App() {
	return (
		<main className="page-wrap px-4 pb-8 pt-14">
			<section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
				<div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
				<div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
				<p className="island-kicker mb-3">FinTrack</p>
				<h1 className="display-title mb-5 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
					Personal finance tracking, built your way.
				</h1>
				<p className="mb-8 max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
					The template clutter is removed and this project is ready for your
					FinTrack requirements. We can now shape data models, auth, dashboards,
					and workflows around your exact goals.
				</p>
				<div className="flex flex-wrap gap-3">
					<a
						href="/about"
						className="rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)]"
					>
						Project Setup Status
					</a>
				</div>
			</section>

			<section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{[
					[
						"Clean Foundation",
						"Starter-specific demo clutter has been removed.",
					],
					[
						"Ready For Features",
						"Next steps can focus directly on FinTrack functionality.",
					],
					[
						"Typed Stack",
						"TanStack Router and Query remain configured and production-ready.",
					],
					[
						"Scalable Structure",
						"Routes, providers, and styles are organized for incremental growth.",
					],
				].map(([title, desc], index) => (
					<article
						key={title}
						className="island-shell feature-card rise-in rounded-2xl p-5"
						style={{ animationDelay: `${index * 90 + 80}ms` }}
					>
						<h2 className="mb-2 text-base font-semibold text-[var(--sea-ink)]">
							{title}
						</h2>
						<p className="m-0 text-sm text-[var(--sea-ink-soft)]">{desc}</p>
					</article>
				))}
			</section>

			<section className="island-shell mt-8 rounded-2xl p-6">
				<p className="island-kicker mb-2">Next Implementation Phase</p>
				<ul className="m-0 list-disc space-y-2 pl-5 text-sm text-[var(--sea-ink-soft)]">
					<li>Define your FinTrack feature list and MVP scope.</li>
					<li>
						Design database entities for accounts, categories, and transactions.
					</li>
					<li>
						Build first vertical slice: add transaction, list, and summary
						cards.
					</li>
				</ul>
			</section>
		</main>
	);
}
