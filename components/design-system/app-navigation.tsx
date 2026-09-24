import Link from "next/link";

import { cn } from "@/lib/utils";

import { BrandMark } from "./brand-mark";

export type NavItem = {
  label: string;
  href: string;
  active?: boolean;
};

type AppSidebarProps = {
  label: string;
  brandSublabel: string;
  items: NavItem[];
};

type MobileNavProps = {
  label: string;
  items: NavItem[];
};

export function AppSidebar({ label, brandSublabel, items }: AppSidebarProps) {
  return (
    <aside className="sidebar" aria-label={label}>
      <BrandMark sublabel={brandSublabel} />
      <nav className="desktop-nav">
        {items.map((item) => (
          <Link
            className={cn("nav-item", item.active && "active")}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            key={item.label}
          >
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export function MobileNav({ label, items }: MobileNavProps) {
  return (
    <nav className="mobile-nav" aria-label={label}>
      {items.map((item) => (
        <Link
          className={cn(item.active && "active")}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          key={item.label}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
