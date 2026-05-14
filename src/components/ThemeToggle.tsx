import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

function getInitialMode(): ThemeMode {
	if (typeof window === "undefined") {
		return "light";
	}

	const stored = window.localStorage.getItem("theme");
	if (stored === "light" || stored === "dark") {
		return stored;
	}

	return "light";
}

function applyThemeMode(mode: ThemeMode) {
	document.documentElement.classList.remove("light", "dark");
	document.documentElement.classList.add(mode);
	document.documentElement.setAttribute("data-theme", mode);
	document.documentElement.style.colorScheme = mode;
}

export default function ThemeToggle() {
	const [mode, setMode] = useState<ThemeMode>("light");

	useEffect(() => {
		const initialMode = getInitialMode();
		setMode(initialMode);
		applyThemeMode(initialMode);
	}, []);

	function toggleMode() {
		const nextMode: ThemeMode = mode === "light" ? "dark" : "light";
		setMode(nextMode);
		applyThemeMode(nextMode);
		window.localStorage.setItem("theme", nextMode);
	}

	const label = `Theme: ${mode}. Click to switch.`;

	return (
		<button
			type="button"
			onClick={toggleMode}
			aria-label={label}
			className="relative inline-flex h-8 w-14 items-center rounded-full border border-border bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground shadow-sm transition-all hover:bg-accent hover:scale-105"
		>
			<span
				className={`flex h-5 w-5 items-center justify-center rounded-full bg-primary transition-all duration-200 ${
					mode === "dark" ? "translate-x-6" : "translate-x-0"
				}`}
			>
				{mode === "dark" ? (
					<svg
						className="h-3 w-3 text-primary-foreground"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
						/>
					</svg>
				) : (
					<svg
						className="h-3 w-3 text-primary-foreground"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
						/>
					</svg>
				)}
			</span>
		</button>
	);
}
