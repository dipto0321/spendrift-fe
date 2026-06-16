import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";

type ThemeMode = "light" | "dark";

// Dark-theme-first per the design philosophy: default to dark and only switch
// to light when the user has explicitly chosen it (stored from the toggle). We
// deliberately don't follow `prefers-color-scheme` — the media query reports
// "light" for users with no OS preference, which would make light the de-facto
// default and defeat dark-first. Must stay in sync with public/theme-init.js
// (the pre-hydration script that prevents a flash of the wrong theme).
function getInitialMode(): ThemeMode {
	if (typeof window === "undefined") {
		return "dark";
	}

	return window.localStorage.getItem("theme") === "light" ? "light" : "dark";
}

function applyThemeMode(mode: ThemeMode) {
	document.documentElement.classList.remove("light", "dark");
	document.documentElement.classList.add(mode);
	document.documentElement.setAttribute("data-theme", mode);
	document.documentElement.style.colorScheme = mode;
}

export default function ThemeToggle() {
	const [mode, setMode] = useState<ThemeMode>("dark");

	useEffect(() => {
		const initialMode = getInitialMode();
		setMode(initialMode);
		applyThemeMode(initialMode);
	}, []);

	function setTheme(nextMode: ThemeMode) {
		setMode(nextMode);
		applyThemeMode(nextMode);
		window.localStorage.setItem("theme", nextMode);
	}

	const isDark = mode === "dark";

	return (
		<div className="flex items-center gap-2">
			<Sun
				className={`h-4 w-4 transition-colors ${isDark ? "text-muted-foreground" : "text-foreground"}`}
				aria-hidden="true"
			/>
			<Switch
				checked={isDark}
				onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
				aria-label={`Theme: ${mode}. Toggle dark mode.`}
			/>
			<Moon
				className={`h-4 w-4 transition-colors ${isDark ? "text-foreground" : "text-muted-foreground"}`}
				aria-hidden="true"
			/>
		</div>
	);
}
