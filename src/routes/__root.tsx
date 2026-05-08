import { getLocale } from "#/paraglide/runtime";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import AppSidebar from "../components/AppSidebar";

import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import TanStackQueryProvider from "../integrations/tanstack-query/root-provider";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	beforeLoad: async () => {
		// Other redirect strategies are possible; see
		// https://github.com/TanStack/router/tree/main/examples/react/i18n-paraglide#offline-redirect
		if (typeof document !== "undefined") {
			document.documentElement.setAttribute("lang", getLocale());
		}
	},

	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "FinTrack",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang={getLocale()} suppressHydrationWarning>
			<head>
				<script src="/theme-init.js" />
				<HeadContent />
			</head>
			<body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]">
				<TanStackQueryProvider>
					<div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(81,153,255,0.16),transparent_28%),radial-gradient(circle_at_85%_18%,rgba(79,184,178,0.12),transparent_24%),linear-gradient(180deg,color-mix(in_oklab,var(--background)_96%,white_4%),var(--background))] ">
						<div className="flex min-h-[calc(100vh-1.5rem)] w-full max-w-[1560px] flex-col gap-3 lg:flex-row">
							<AppSidebar />
							<main className="min-w-0 h-auto flex-1 overflow-hidden  backdrop-blur-sm">
								{children}
							</main>
						</div>
					</div>
					{import.meta.env.DEV ? (
						<TanStackDevtools
							config={{
								position: "bottom-right",
							}}
							plugins={[
								{
									name: "Tanstack Router",
									render: <TanStackRouterDevtoolsPanel />,
								},
								TanStackQueryDevtools,
							]}
						/>
					) : null}
				</TanStackQueryProvider>
				<Scripts />
			</body>
		</html>
	);
}
