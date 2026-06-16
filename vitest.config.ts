import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Isolated config for unit tests. The app's vite.config.ts pulls in the
// TanStack Start / nitro / paraglide plugin chain, which a pure-function test
// run doesn't need (and which slows it down). We only need the `@/` path alias
// plus a node environment — the domain/services functions have no DOM deps.
export default defineConfig({
	plugins: [tsconfigPaths({ projects: ["./tsconfig.json"] })],
	test: {
		environment: "node",
		include: ["src/**/*.test.ts"],
	},
});
