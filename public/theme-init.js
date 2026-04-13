(() => {
  try {
    const stored = window.localStorage.getItem("theme");
    const mode = stored === "light" || stored === "dark" ? stored : "light";
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(mode);
    root.setAttribute("data-theme", mode);
    root.style.colorScheme = mode;
  } catch {
    // Ignore failures (e.g., privacy mode).
  }
})();

