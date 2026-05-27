import { Link, useNavigate } from "@tanstack/react-router";
import {
	BarChart3,
	ChevronRight,
	CircleUserRound,
	LayoutDashboard,
	PiggyBank,
	ReceiptText,
	Settings2,
} from "lucide-react";
import {
	authRepository,
	useAuthSnapshot,
} from "@/features/auth/data/repository";
import { TrackerSelector } from "@/features/trackers/presentation/TrackerSelector";
import ThemeToggle from "./ThemeToggle";

const navItems = [
	{ to: "/", label: "Dashboard", icon: LayoutDashboard },
	{ to: "/expenses", label: "Expenses", icon: ReceiptText },
	{ to: "/budget", label: "Budget", icon: PiggyBank },
	{ to: "/reports", label: "Reports", icon: BarChart3 },
	{ to: "/profile", label: "Profile", icon: CircleUserRound },
	{ to: "/settings", label: "Settings", icon: Settings2 },
] as const;

export default function AppSidebar() {
	const navigate = useNavigate();
	const auth = useAuthSnapshot();
	const user = auth.user;

	return (
		<aside className="w-full lg:w-70 lg:shrink-0 lg:sticky lg:top-3 lg:h-[calc(100vh-1.5rem)]">
			<div className="flex h-full min-h-80 flex-col rounded-2xl border border-border/60 bg-card/50 shadow-sm backdrop-blur-sm dark:shadow-none">
				<div className="flex items-center gap-3 px-4 pt-5 pb-6">
					<div className="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/25">
						<span className="text-lg font-bold tracking-tighter text-white">
							F
						</span>
					</div>
					<div className="min-w-0">
						<p className="m-0 text-base font-bold tracking-tight text-foreground">
							FinTracker
						</p>
						<p className="m-0 text-xs text-muted-foreground">
							Personal Finance
						</p>
					</div>
				</div>

				<TrackerSelector />

				<nav className="space-y-1 px-3 pt-2">
					{navItems.map(({ to, label, icon: Icon }) => (
						<Link
							key={to}
							to={to}
							className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground"
							activeProps={{
								className:
									"flex items-center gap-3 rounded-xl bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary shadow-sm ring-1 ring-primary/20",
							}}
						>
							<Icon className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground group-[&.active]:text-primary" />
							<span className="flex-1">{label}</span>
							<ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
						</Link>
					))}
				</nav>

				<div className="px-3 pt-5">
					<div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
						<div className="flex items-center justify-between gap-4">
							<div>
								<p className="m-0 text-sm font-semibold text-foreground">
									Theme
								</p>
								<p className="m-0 text-xs text-muted-foreground">
									Light or dark mode
								</p>
							</div>
							<ThemeToggle />
						</div>
					</div>
				</div>

				<div className="mt-auto px-3 pt-5">
					<div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
						<div className="flex items-center gap-3">
							<Link
								to="/profile"
								className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-linear-to-br from-amber-400/80 to-orange-500/80 ring-1 ring-border"
							>
								{user?.avatarDataUrl ? (
									<img
										src={user.avatarDataUrl}
										alt={user.name}
										className="h-full w-full object-cover"
									/>
								) : (
									<CircleUserRound className="h-5 w-5 text-white" />
								)}
							</Link>
							<div className="min-w-0 flex-1">
								<Link to="/profile" className="block">
									<p className="m-0 truncate text-sm font-semibold text-foreground">
										{user?.name ?? "Profile"}
									</p>
									<p className="m-0 truncate text-xs text-muted-foreground">
										{user?.email ?? "View Profile"}
									</p>
								</Link>
							</div>
							<button
								type="button"
								onClick={async () => {
									await authRepository.signOut();
									await navigate({ to: "/sign-in" });
								}}
								className="shrink-0 rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/30"
							>
								Sign out
							</button>
						</div>
					</div>
				</div>
			</div>
		</aside>
	);
}
