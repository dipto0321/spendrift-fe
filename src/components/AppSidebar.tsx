import { Link } from "@tanstack/react-router";
import {
	BarChart3,
	ChevronRight,
	CircleUserRound,
	LayoutDashboard,
	PiggyBank,
	ReceiptText,
	Settings2,
} from "lucide-react";

const navItems = [
	{ to: "/", label: "Dashboard", icon: LayoutDashboard },
	{ to: "/expenses", label: "Expenses", icon: ReceiptText },
	{ to: "/budget", label: "Budget", icon: PiggyBank },
	{ to: "/reports", label: "Reports", icon: BarChart3 },
	{ to: "/settings", label: "Settings", icon: Settings2 },
] as const;

export default function AppSidebar() {
	return (
		<aside className="w-full lg:w-[290px] lg:shrink-0 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
			<div className="flex h-full min-h-[320px] flex-col rounded-[28px]  backdrop-blur-xl sm:px-5 sm:py-5">
				<div className="flex items-center gap-3 px-1 pb-6 pt-1">
					<div className="grid h-11 w-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,#1d6cff,#4bc9ff)] shadow-[0_14px_30px_rgba(29,108,255,0.35)]">
						<span className="text-lg font-black tracking-[-0.08em] text-[#08111d]">
							F
						</span>
					</div>
					<div className="min-w-0">
						<p className="m-0 text-[1.03rem] font-bold tracking-[-0.03em] text-white">
							FinTracker
						</p>
						<p className="m-0 text-xs text-white/52">
							Personal finance workspace
						</p>
					</div>
				</div>

				<nav className="space-y-2">
					{navItems.map(({ to, label, icon: Icon }) => (
						<Link
							key={to}
							to={to}
							className="group flex items-center gap-3 rounded-2xl px-4 py-3 text-[0.98rem] font-medium text-white/72 transition duration-200 hover:bg-white/[0.06] hover:text-white"
							activeProps={{
								className:
									"group flex items-center gap-3 rounded-2xl bg-[linear-gradient(135deg,rgba(40,90,170,0.46),rgba(34,52,92,0.66))] px-4 py-3 text-[0.98rem] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_24px_rgba(11,18,32,0.32)] ring-1 ring-white/[0.08]",
							}}
						>
							<Icon className="h-4 w-4 shrink-0 text-white/75 transition group-hover:text-white" />
							<span className="flex-1">{label}</span>
							<ChevronRight className="h-4 w-4 shrink-0 text-white/[0.22] transition group-hover:text-white/55" />
						</Link>
					))}
				</nav>

				<div className="mt-auto pt-6">
					<div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
						<div className="flex items-center gap-3">
							<div className="grid h-12 w-12 place-items-center rounded-full bg-[linear-gradient(135deg,#f2b48f,#e7f0ff_58%,#7fc8ff)] ring-2 ring-white/10">
								<CircleUserRound className="h-6 w-6 text-[#132135]" />
							</div>
							<div className="min-w-0">
								<p className="m-0 truncate text-sm font-semibold text-white">
									John Doe
								</p>
								<p className="m-0 text-sm text-white/58">View Profile</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</aside>
	);
}
