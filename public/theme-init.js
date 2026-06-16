(() => {
  try {
    // Dark-theme-first: default to dark unless the user explicitly chose light.
    // Keep this in sync with getInitialMode() in src/components/ThemeToggle.tsx.
    // Runs before hydration so the correct theme is painted with no flash.
    const mode =
      window.localStorage.getItem("theme") === "light" ? "light" : "dark";
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(mode);
    root.setAttribute("data-theme", mode);
    root.style.colorScheme = mode;
  } catch {
    // Ignore failures (e.g., privacy mode).
  }
})();
