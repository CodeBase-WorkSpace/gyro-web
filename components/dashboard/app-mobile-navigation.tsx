"use client";

import Link from "next/link";
import {
	ActivityIcon,
	HomeIcon,
	type LucideIcon,
	SettingsIcon,
	ShieldCheckIcon,
	UtensilsIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type MobileNavigationItem = {
	label: string;
	href: string;
	icon: LucideIcon;
};

const navigationItems: MobileNavigationItem[] = [
	{ label: "امروز", href: "/dashboard", icon: HomeIcon },
	{ label: "غذاها", href: "/foods", icon: UtensilsIcon },
	{ label: "پیشرفت", href: "/progress", icon: ActivityIcon },
	{ label: "تنظیمات", href: "/profile", icon: SettingsIcon },
];

const coachTargets: Record<string, string | undefined> = {
	"/foods": "foods-nav",
	"/progress": "progress-nav",
	"/profile": "profile-nav",
};

const adminNavigationItem: MobileNavigationItem = {
	label: "ادمین",
	href: "/admin",
	icon: ShieldCheckIcon,
};

export function AppMobileNavigation({
	isAdmin,
	activeHref,
}: {
	isAdmin: boolean;
	activeHref?: string;
}) {
	const pathname = usePathname();
	const resolvedActiveHref = activeHref ?? pathname;
	const items = isAdmin
		? [...navigationItems, adminNavigationItem]
		: navigationItems;

	return (
		<nav
			className="fixed inset-x-3 bottom-3 z-30 grid gap-1 rounded-3xl border bg-card/95 p-2 shadow-2xl lg:hidden"
			style={{
				gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
			}}
			aria-label="ناوبری پایین"
		>
			{items.map((item) => {
				const isActive =
					item.href === "/"
						? resolvedActiveHref === "/"
						: resolvedActiveHref.startsWith(item.href);

				return (
					<Link
						key={item.label}
						href={item.href}
						data-coach-target={coachTargets[item.href]}
						aria-current={isActive ? "page" : undefined}
						className={cn(
							"flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-bold text-muted-foreground transition-colors",
							isActive && "bg-accent text-accent-foreground",
						)}
					>
						<item.icon aria-hidden="true" />
						{item.label}
					</Link>
				);
			})}
		</nav>
	);
}
