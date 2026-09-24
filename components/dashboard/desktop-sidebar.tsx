"use client";

import Image from "next/image";
import Link from "next/link";
import {
	ActivityIcon,
	HomeIcon,
	type LucideIcon,
	PanelRightCloseIcon,
	PanelRightOpenIcon,
	SettingsIcon,
	ShieldCheckIcon,
	UtensilsIcon,
} from "lucide-react";
import {usePathname} from "next/navigation";
import {useMemo, useState} from "react";

import {BrandMark} from "@/components/design-system/brand-mark";
import {Button} from "@/components/ui/button";
import {PwaUpdateButton} from "@/components/pwa/pwa-update-button";
import {cn} from "@/lib/utils";

type DesktopSidebarProps = {
	isAdmin: boolean;
};

type DesktopNavigationItem = {
	label: string;
	href: string;
	icon: LucideIcon;
};

const navigationItems: DesktopNavigationItem[] = [
	{ label: "امروز", href: "/dashboard", icon: HomeIcon },
	{ label: "غذاها", href: "/foods", icon: UtensilsIcon },
	{ label: "پیشرفت", href: "/progress", icon: ActivityIcon },
	{ label: "تنظیمات", href: "/profile", icon: SettingsIcon },
];

const adminNavigationItem: DesktopNavigationItem = {
	label: "ادمین",
	href: "/admin",
	icon: ShieldCheckIcon,
};

export function DesktopSidebar({ isAdmin }: DesktopSidebarProps) {
	const pathname = usePathname();
	const [isCollapsed, setIsCollapsed] = useState(false);
	const items = useMemo(
		() =>
			isAdmin
				? [...navigationItems, adminNavigationItem]
				: navigationItems,
		[isAdmin],
	);

	return (
		<aside
			data-sidebar-state={isCollapsed ? "collapsed" : "expanded"}
			className={cn(
				"fixed inset-y-0 right-0 z-40 hidden flex-col border-l border-sidebar-border bg-sidebar/96 text-sidebar-foreground shadow-[0_24px_80px_color-mix(in_oklch,var(--background)_72%,black)] backdrop-blur-xl transition-[width] duration-200 ease-out lg:flex",
				isCollapsed ? "w-20" : "w-72",
			)}
			aria-label="ناوبری اصلی"
		>
			<div className="flex h-full min-h-0 flex-col p-3">
				<div
					className={cn(
						"flex h-14 items-center gap-2",
						isCollapsed ? "justify-center" : "justify-between",
					)}
				>
					{isCollapsed ? (
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="group relative size-11 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring"
							aria-label="باز کردن نوار کناری"
							aria-expanded={false}
							title="باز کردن نوار کناری"
							onClick={() => setIsCollapsed(false)}
						>
							<Image
								src="/brand/gyro-symbol-48.png"
								alt=""
								width={40}
								height={40}
								className="size-10 object-contain transition-opacity duration-150 group-hover:opacity-0 group-focus-visible:opacity-0"
							/>
							<PanelRightOpenIcon className="absolute size-5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100" />
						</Button>
					) : (
						<BrandMark sublabel="دفتر تغذیه" />
					)}

					{!isCollapsed && (
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
							aria-label="جمع کردن نوار کناری"
							aria-expanded
							onClick={() => setIsCollapsed(true)}
						>
							<PanelRightCloseIcon />
						</Button>
					)}
				</div>

				<nav
					className="mt-6 flex flex-col gap-1.5"
					aria-label="صفحه‌ها"
				>
					{items.map((item) => {
						const isActive =
							item.href === "/"
								? pathname === "/"
								: item.href.startsWith("#")
									? pathname === "/"
									: pathname.startsWith(item.href);

						return (
							<Link
								key={item.label}
								href={item.href}
								title={item.label}
								data-coach-target={
									item.href === "/foods"
										? "foods-nav"
										: item.href === "/progress"
											? "progress-nav"
											: item.href === "/profile"
												? "profile-nav"
												: undefined
								}
								aria-label={item.label}
								aria-current={isActive ? "page" : undefined}
								className={cn(
									"flex h-11 items-center rounded-xl text-sm font-bold text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring",
									isCollapsed
										? "justify-center px-0"
										: "gap-3 px-3",
									isActive &&
										"bg-sidebar-accent text-sidebar-accent-foreground",
								)}
							>
								<item.icon aria-hidden="true" />
								<span
									className={cn(
										"truncate",
										isCollapsed && "sr-only",
									)}
								>
									{item.label}
								</span>
							</Link>
						);
					})}
				</nav>

				<div className="mt-auto pt-3">
					<PwaUpdateButton surface="desktop" compact={isCollapsed} />
				</div>
			</div>
		</aside>
	);
}
