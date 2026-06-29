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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
import { MonthProvider, useMonth } from "@/shared/ui/MonthContext";
import ThemeToggle from "@/shared/ui/ThemeToggle";
import TanStackQueryProvider from "../integrations/tanstack-query/root-provider";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	validateSearch: (search: Record<string, unknown>): { tracker?: string } => ({
		tracker: typeof search.tracker === "string" ? search.tracker : undefined,
	}),
	search: {
		middlewares: [retainSearchParams(["tracker"])],
	},

	beforeLoad: async () => {
		if (typeof document !== "undefined") {
			document.documentElement.setAttribute("lang", getLocale());
		}
	},

	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Spendrift" },
		],
		links: [
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
			{ rel: "stylesheet", href: appCss },
		],
	}),
	shellComponent: RootDocument,
});

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
							<MonthProvider>
								<WorkspaceGate>{children}</WorkspaceGate>
								<React.Suspense fallback={null}>
									<DevtoolsPanel />
								</React.Suspense>
							</MonthProvider>
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

/** Pages that show the month selector in the topbar. */
const MONTH_PAGES = new Set(["/", "/budget"]);

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

function TopbarMonthSelect() {
	const { selectedMonth, setSelectedMonth, months } = useMonth();
	return (
		<Select value={selectedMonth} onValueChange={setSelectedMonth}>
			<SelectTrigger
				className="h-9 w-auto gap-1.5 border-border/60 bg-muted/30 text-sm font-medium"
				aria-label="Select month"
			>
				<SelectValue />
			</SelectTrigger>
			<SelectContent align="end">
				{months.map((m) => (
					<SelectItem key={m.value} value={m.value}>
						{m.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
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

	const [mounted, setMounted] = useState(false);
	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		authRepository.bootstrap();
	}, []);

	useEffect(() => {
		if (!auth.isAuthenticated && !onAuthPage) {
			navigate({ to: "/sign-in" });
		} else if (auth.isAuthenticated && onAuthPage) {
			navigate({ to: "/" });
		}
	}, [auth.isAuthenticated, onAuthPage, navigate]);

	if (!mounted) {
		return <FullScreenMessage>Loading…</FullScreenMessage>;
	}

	if (onAuthPage) {
		return auth.isAuthenticated ? (
			<FullScreenMessage>Redirecting…</FullScreenMessage>
		) : (
			<>{children}</>
		);
	}

	if (!auth.isAuthenticated) {
		return <FullScreenMessage>Redirecting to sign in…</FullScreenMessage>;
	}

	if (isLoading) {
		return <FullScreenMessage>Loading your workspace…</FullScreenMessage>;
	}

	if (!hasTrackers) {
		return <TrackerOnboarding />;
	}

	const pageTitle = PAGE_TITLES[pathname] ?? "Spendrift";
	const showMonthSelect = MONTH_PAGES.has(pathname);

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
					<div className="ml-auto flex items-center gap-1.5">
						{showMonthSelect ? <TopbarMonthSelect /> : null}
						<ThemeToggle />
					</div>
				</header>
				<div className="flex flex-1 flex-col">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
