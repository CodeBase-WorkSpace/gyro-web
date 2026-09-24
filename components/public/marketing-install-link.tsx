import {DownloadIcon} from "lucide-react";
import Link from "next/link";

import {buttonVariants} from "@/components/ui/button";
import {appInstallHref} from "@/lib/seo/metadata";
import {cn} from "@/lib/utils";

/**
 * Marketing pages live on a different origin from the installed app. Sending
 * visitors to the app host is necessary for its PWA install prompt to be valid.
 */
export function MarketingInstallLink() {
  return (
    <Link
      href={appInstallHref}
      className={cn(buttonVariants({variant: "secondary", size: "lg"}), "gap-2 rounded-full px-4 shadow-sm")}
    >
      <DownloadIcon className="size-4" aria-hidden="true" />
      نصب جیرو
    </Link>
  );
}
