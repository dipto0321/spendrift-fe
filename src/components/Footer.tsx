export default function Footer() {
	const year = new Date().getFullYear();

	return (
		<footer className="mt-16 border-t border-[var(--line)] px-4 pb-12 pt-10 text-[var(--sea-ink-soft)]">
			<div className="page-wrap flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
				<p className="m-0 text-sm">&copy; {year} FinTrack.</p>
				<p className="m-0 text-sm">Built for clarity, trust, and speed.</p>
			</div>
		</footer>
	);
}
