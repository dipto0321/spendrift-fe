import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	retainSearchParams,
	Scripts,
	useNavigate,
	useRouterState,
} from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
	authRepository,
	useAuthSnapshot,
} from "@/features/auth/data/repository";
import {
	TrackerProvider,
	useTracker,
} from "@/features/trackers/presentation/TrackerContext";
import { TrackerOnboarding } from "@/features/trackers/presentation/TrackerOnboarding";
import { getLocale } from "@/paraglide/runtime";
import AppSidebar from "@/shared/ui/AppSidebar";
import TanStackQueryProvider from "../integrations/tanstack-query/root-provider";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	// The active tracker lives in the URL as ?tracker=<id>. Declaring it on the
	// root route makes it a typed search param everywhere, and retainSearchParams
	// keeps it across every navigation so links never have to pass it explicitly.
	validateSearch: (search: Record<string, unknown>): { tracker?: string } => ({
		tracker: typeof search.tracker === "string" ? search.tracker : undefined,
	}),
	search: {
		middlewares: [retainSearchParams(["tracker"])],
	},

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
			// Load the web font via <link> with preconnect instead of a CSS
			// `@import` (which is render-blocking and fetched serially after the
			// main stylesheet). preconnect warms the gstatic connection; display=swap
			// shows fallback text immediately, then swaps in Manrope.
			{ rel: "preconnect", href: "https://fonts.googleapis.com" },
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous",
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap",
			},
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
});

// Completely bypass loading the Devtools Panel in production
const DevtoolsPanel = import.meta.env.PROD
	? () => null
	: React.lazy(() =>
			import("@/shared/ui/DevtoolsPanel").then((m) => ({
				default: m.DevtoolsPanel,
			})),
		);

function RootDocument({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang={getLocale()} suppressHydrationWarning>
			<head>
				<script src="/theme-init.js" />
				<HeadContent />
			</head>
			<body className="font-sans antialiased wrap-anywhere selection:bg-primary/20">
				<TanStackQueryProvider>
					<TooltipProvider delayDuration={300}>
						<TrackerProvider>
							<WorkspaceGate>{children}</WorkspaceGate>
							<React.Suspense fallback={null}>
								<DevtoolsPanel />
							</React.Suspense>
						</TrackerProvider>
					</TooltipProvider>
				</TanStackQueryProvider>
				<Toaster position="top-right" richColors />
				<Scripts />
			</body>
		</html>
	);
}

const AUTH_PATHS = new Set(["/sign-in", "/sign-up"]);

const PAGE_TITLES: Record<string, string> = {
	"/": "Dashboard",
	"/expenses": "Expenses",
	"/budget": "Budget",
	"/reports": "Reports",
	"/settings": "Settings",
	"/profile": "Profile",
	"/ai": "AI Settings",
};

function FullScreenMessage({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<div className="grid min-h-screen place-items-center bg-background">
			<p className="text-sm text-muted-foreground">{children}</p>
		</div>
	);
}

function WorkspaceGate({ children }: Readonly<{ children: React.ReactNode }>) {
	const auth = useAuthSnapshot();
	const { hasTrackers, isLoading } = useTracker();
	const navigate = useNavigate();
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const onAuthPage = AUTH_PATHS.has(pathname);

	// Auth state comes from localStorage, which doesn't exist during SSR. Render
	// a stable placeholder until mounted so the server and first client render
	// agree (no hydration mismatch); only then branch on the real auth state.
	const [mounted, setMounted] = useState(false);
	useEffect(() => {
		setMounted(true);
	}, []);

	// On first load, if a token is present, resolve the session against the API
	// (/users/me). Idempotent and a no-op when there is no token.
	useEffect(() => {
		authRepository.bootstrap();
	}, []);

	// Auth lives in localStorage, so it is unknown during SSR and the route-level
	// beforeLoad guards can't see it on a hard page load. Enforce the redirects
	// here on the client as the source of truth: guests land on /sign-in, and
	// authenticated users never sit on the auth pages.
	useEffect(() => {
		if (!auth.isAuthenticated && !onAuthPage) {
			navigate({ to: "/sign-in" });
		} else if (auth.isAuthenticated && onAuthPage) {
			navigate({ to: "/" });
		}
	}, [auth.isAuthenticated, onAuthPage, navigate]);

	// Until mounted, server and client can't agree on auth state — render the
	// same neutral placeholder on both to avoid a hydration mismatch.
	if (!mounted) {
		return <FullScreenMessage>Loading…</FullScreenMessage>;
	}

	// Auth pages render their own full-screen form when you're a guest; while an
	// authenticated user is being bounced off them, show a placeholder.
	if (onAuthPage) {
		return auth.isAuthenticated ? (
			<FullScreenMessage>Redirecting…</FullScreenMessage>
		) : (
			<>{children}</>
		);
	}

	// Every other route is protected: hold the redirect for guests.
	if (!auth.isAuthenticated) {
		return <FullScreenMessage>Redirecting to sign in…</FullScreenMessage>;
	}

	// Authenticated: decide onboarding vs. workspace on tracker existence. Wait
	// for the trackers query so we never flash onboarding before they load.
	if (isLoading) {
		return <FullScreenMessage>Loading your workspace…</FullScreenMessage>;
	}

	if (!hasTrackers) {
		return <TrackerOnboarding />;
	}

	const pageTitle = PAGE_TITLES[pathname] ?? "Spendrift";

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur">
					<SidebarTrigger className="-ml-1" />
					<Separator orientation="vertical" className="mr-1 h-5" />
					<span className="text-sm font-semibold text-foreground">
						{pageTitle}
					</span>
				</header>
				<div className="flex flex-1 flex-col">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
