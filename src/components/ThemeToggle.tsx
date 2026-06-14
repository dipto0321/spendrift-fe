import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";

type ThemeMode = "light" | "dark";

function getInitialMode(): ThemeMode {
	if (typeof window === "undefined") {
		return "light";
	}

	const stored = window.localStorage.getItem("theme");
	return stored === "dark" ? "dark" : "light";
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
