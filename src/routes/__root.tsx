import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useSyncExternalStore } from "react";
import { useAuthSnapshot } from "@/features/auth/data/repository";
import {
	getTrackerOnboardingStatus,
	subscribeTrackerOnboardingStatusChange,
} from "@/features/trackers/data/onboarding";
import { TrackerProvider } from "@/features/trackers/presentation/TrackerContext";
import { TrackerOnboarding } from "@/features/trackers/presentation/TrackerOnboarding";
import { getLocale } from "@/paraglide/runtime";
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
				title: "Spendrift",
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

function RootDocument({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang={getLocale()} suppressHydrationWarning>
			<head>
				<script src="/theme-init.js" />
				<HeadContent />
			</head>
			<body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-primary/20">
				<TanStackQueryProvider>
					<TrackerProvider>
						<WorkspaceGate>{children}</WorkspaceGate>
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
					</TrackerProvider>
				</TanStackQueryProvider>
				<Scripts />
			</body>
		</html>
	);
}

function WorkspaceGate({ children }: Readonly<{ children: React.ReactNode }>) {
	const auth = useAuthSnapshot();
	const hasCompletedOnboarding = useSyncExternalStore(
		subscribeTrackerOnboardingStatusChange,
		getTrackerOnboardingStatus,
		() => false,
	);

	if (!auth.isAuthenticated) {
		return <>{children}</>;
	}

	if (!hasCompletedOnboarding) {
		return <TrackerOnboarding />;
	}

	return (
		<div className="min-h-screen bg-background">
			<div className="flex min-h-[calc(100vh-1.5rem)] w-full max-w-[1560px] flex-col gap-3 p-3 lg:flex-row lg:gap-4 lg:p-4">
				<AppSidebar />
				<main className="min-w-0 h-auto flex-1 overflow-hidden rounded-2xl border border-border/60 bg-card/30 backdrop-blur-sm">
					{children}
				</main>
			</div>
		</div>
	);
}
