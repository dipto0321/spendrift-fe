import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	retainSearchParams,
	Scripts,
	useNavigate,
	useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
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
import AppSidebar from "../components/AppSidebar";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
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
				<Toaster position="top-right" richColors />
				<Scripts />
			</body>
		</html>
	);
}

const AUTH_PATHS = new Set(["/sign-in", "/sign-up"]);

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
