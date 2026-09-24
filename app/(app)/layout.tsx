import type {ReactNode} from "react";

import {AppMobileNavigation} from "@/components/dashboard/app-mobile-navigation";
import {DesktopSidebar} from "@/components/dashboard/desktop-sidebar";
import {PwaInstallPrompt} from "@/components/pwa/pwa-install-prompt";
import {getSession} from "@/lib/auth/session";

export default async function AppLayout({children}: {children: ReactNode}) {
  const session = await getSession();
  const isAdmin = session.isAuthenticated && session.user.role === "ADMIN";

  return (
    <div className="dashboard-shell min-h-svh bg-background text-foreground">
      <DesktopSidebar isAdmin={isAdmin} />

      <a
        className="sr-only focus:not-sr-only focus:fixed focus:right-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        href="#main-content"
      >
        رفتن به محتوای اصلی
      </a>

      {children}

      <AppMobileNavigation isAdmin={isAdmin} />
      <PwaInstallPrompt />
    </div>
  );
}
