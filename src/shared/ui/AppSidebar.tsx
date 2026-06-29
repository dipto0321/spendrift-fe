import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
	BarChart3,
	Bot,
	CircleUserRound,
	LayoutDashboard,
	LogOut,
	PiggyBank,
	ReceiptText,
	Settings2,
	TrendingUp,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
	authRepository,
	useAuthSnapshot,
} from "@/features/auth/data/repository";
import { TrackerSwitcher } from "@/features/trackers/presentation/TrackerSwitcher";
import ThemeToggle from "./ThemeToggle";

const NAV_ITEMS = [
	{ to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
	{ to: "/expenses", label: "Expenses", icon: ReceiptText, exact: false },
	{ to: "/budget", label: "Budget", icon: PiggyBank, exact: false },
	{ to: "/reports", label: "Reports", icon: BarChart3, exact: false },
	{ to: "/settings", label: "Settings", icon: Settings2, exact: false },
	{ to: "/ai", label: "AI Settings", icon: Bot, exact: false },
] as const;

export default function AppSidebar() {
	const navigate = useNavigate();
	const auth = useAuthSnapshot();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const user = auth.user;

	const initials = user?.name
		? user.name
				.split(" ")
				.map((p: string) => p[0])
				.filter(Boolean)
				.slice(0, 2)
				.join("")
				.toUpperCase()
		: "";

	return (
		<Sidebar>
			<SidebarHeader className="gap-3 p-3">
				<div className="flex items-center gap-2 px-1 pt-1">
					<span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
						<TrendingUp className="size-4" />
					</span>
					<span className="text-base font-semibold tracking-tight text-sidebar-foreground">
						Spendrift
					</span>
				</div>
				<TrackerSwitcher />
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Menu</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => {
								const isActive = exact
									? pathname === to
									: pathname.startsWith(to);
								return (
									<SidebarMenuItem key={to}>
										<SidebarMenuButton isActive={isActive} asChild tooltip={label}>
											<Link to={to}>
												<Icon />
												<span>{label}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="gap-2 p-3">
				<div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
					<span className="text-xs text-muted-foreground">Theme</span>
					<ThemeToggle />
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="flex w-full items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
						>
							<Avatar className="size-8">
								{user?.avatarDataUrl ? (
									<AvatarImage src={user.avatarDataUrl} alt={user.name} />
								) : null}
								<AvatarFallback className="bg-linear-to-br from-amber-400/80 to-orange-500/80 text-white text-xs">
									{initials || <CircleUserRound className="size-4" />}
								</AvatarFallback>
							</Avatar>
							<div className="min-w-0 flex-1">
								<p className="m-0 truncate text-sm font-semibold text-foreground">
									{user?.name ?? "Profile"}
								</p>
								<p className="m-0 truncate text-xs text-muted-foreground">
									{user?.email ?? "View profile"}
								</p>
							</div>
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						side="top"
						align="end"
						className="w-[--radix-dropdown-menu-trigger-width] min-w-52"
					>
						<DropdownMenuLabel className="truncate">
							{user?.email ?? "Account"}
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild>
							<Link to="/profile">
								<CircleUserRound className="size-4" />
								Profile
							</Link>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onSelect={async () => {
								await authRepository.signOut();
								await navigate({ to: "/sign-in" });
							}}
						>
							<LogOut className="size-4" />
							Sign out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
