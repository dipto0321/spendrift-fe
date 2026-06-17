import { TanStackDevtools } from "@tanstack/react-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import TanStackQueryDevtools from "../../integrations/tanstack-query/devtools";

export function DevtoolsPanel() {
	if (import.meta.env.PROD) return null;

	return (
		<TanStackDevtools
			config={{ position: "bottom-right" }}
			plugins={[
				{
					name: "Tanstack Router",
					render: <TanStackRouterDevtoolsPanel />,
				},
				TanStackQueryDevtools,
			]}
		/>
	);
}
