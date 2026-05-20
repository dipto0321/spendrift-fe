import { m } from "@/paraglide/messages";
import { getLocale, locales, setLocale } from "@/paraglide/runtime";

export default function ParaglideLocaleSwitcher() {
	const currentLocale = getLocale();

	return (
		<div className="flex items-center gap-2 text-sm font-semibold text-[var(--sea-ink)]">
			<span className="hidden text-[var(--sea-ink-soft)] sm:inline">
				{m.current_locale({ locale: currentLocale })}
			</span>
			<div className="flex items-center gap-1">
				{locales.map((locale) => {
					const isActive = locale === currentLocale;
					return (
						<button
							key={locale}
							type="button"
							onClick={() => setLocale(locale)}
							aria-pressed={isActive}
							className={[
								"rounded-full border px-2.5 py-1 text-xs font-semibold transition",
								isActive
									? "border-[var(--chip-line)] bg-[var(--link-bg-hover)] text-[var(--sea-ink)]"
									: "border-[var(--chip-line)] bg-transparent text-[var(--sea-ink-soft)] hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]",
							].join(" ")}
						>
							{locale.toUpperCase()}
						</button>
					);
				})}
			</div>
		</div>
	);
}
