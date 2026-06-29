import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type ThemeMode = "light" | "dark";

function getInitialMode(): ThemeMode {
	if (typeof window === "undefined") return "dark";
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
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		const initial = getInitialMode();
		setMode(initial);
		applyThemeMode(initial);
		setMounted(true);
	}, []);

	function toggle() {
		const next: ThemeMode = mode === "dark" ? "light" : "dark";
		setMode(next);
		applyThemeMode(next);
		window.localStorage.setItem("theme", next);
	}

	return (
		<Button
			variant="ghost"
			size="icon"
			aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
			onClick={toggle}
		>
			{mounted && mode === "dark" ? (
				<Sun className="size-4" />
			) : (
				<Moon className="size-4" />
			)}
		</Button>
	);
}
