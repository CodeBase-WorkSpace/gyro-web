import Link from "next/link";
import {DownloadIcon, PlayIcon, StoreIcon} from "lucide-react";

import {appInstallHref} from "@/lib/seo/metadata";

export function DownloadBadges() {
  return <section className="rounded-[2rem] border border-border/80 bg-card/45 p-5 sm:p-6" aria-labelledby="download-badges-title">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-black text-primary">همیشه نزدیک دفتر روزانه‌تان</p><h2 id="download-badges-title" className="mt-1 text-2xl font-black">جیرو را از صفحه اصلی باز کنید.</h2></div><p className="text-sm font-bold leading-7 text-muted-foreground">بدون نصب از فروشگاه؛ روی موبایل مثل اپ.</p></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
      <Link href={appInstallHref} className="group flex min-h-16 items-center gap-3 rounded-2xl border border-white/10 bg-black px-4 text-right text-white shadow-[0_10px_24px_rgb(0_0_0_/_24%)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><span className="grid size-9 place-items-center rounded-xl border border-white/20 bg-white/10"><DownloadIcon className="size-5" aria-hidden="true" /></span><span><small className="block text-[0.65rem] font-bold text-white/70">نصب روی صفحه اصلی</small><strong className="block text-base font-black">وب اپ جیرو</strong></span></Link>
      <ComingSoonBadge icon={PlayIcon} label="Google Play" />
      <ComingSoonBadge icon={StoreIcon} label="کافه بازار" />
      <ComingSoonBadge icon={StoreIcon} label="مایکت" />
    </div>
  </section>;
}

function ComingSoonBadge({icon: Icon, label}: {icon: typeof PlayIcon; label: string}) {
  return <button type="button" disabled className="flex min-h-16 items-center gap-3 rounded-2xl border border-white/10 bg-black/75 px-4 text-right text-white/80 opacity-70"><span className="grid size-9 place-items-center rounded-xl border border-white/15 bg-white/10"><Icon className="size-5" aria-hidden="true" /></span><span><small className="block text-[0.65rem] font-bold text-white/60">به‌زودی</small><strong className="block text-base font-black">{label}</strong></span></button>;
}
