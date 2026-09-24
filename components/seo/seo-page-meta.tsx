import Link from "next/link";

export function SeoPageMeta({
                              updatedAt,
                              reviewer,
                              sourcePolicyHref,
                              disclaimer,
                            }: {
  updatedAt: string;
  reviewer?: string;
  sourcePolicyHref?: string;
  disclaimer?: string;
}) {
  return (
    <aside
      className="rounded-3xl border border-border/80 bg-card/45 p-4 text-sm font-bold leading-7 text-muted-foreground">
      <p>آخرین به‌روزرسانی: {updatedAt}</p>
      {reviewer ? <p>بازبینی محتوا: {reviewer}</p> : null}
      {sourcePolicyHref ? (
        <p>
          <Link href={sourcePolicyHref} className="text-primary underline-offset-4 hover:underline">
            روش بررسی و منابع محتوا
          </Link>
        </p>
      ) : null}
      {disclaimer ? <p className="mt-2">{disclaimer}</p> : null}
    </aside>
  );
}
