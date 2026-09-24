import {AppTopBar} from "@/components/design-system/app-top-bar";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Skeleton} from "@/components/ui/skeleton";

export default function ProgressLoading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-10">
      <main
        id="main-content"
        className="flex min-w-0 flex-1 flex-col gap-6"
        aria-label="در حال بارگذاری پیشرفت و اهداف"
      >
        <AppTopBar
          title="پیشرفت و اهداف"
          description="در حال خواندن گزارش‌ها"
          backLink={{href: "/dashboard", label: "بازگشت به امروز"}}
          showDateControl={false}
          showMobileDateAction={false}
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {["روزهای فعال", "میانگین کالری", "ثبت وزن", "تغییر وزن"].map((label) => (
            <Card key={label} className="rounded-2xl border bg-card/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-36" />
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </section>
      </main>
    </div>
  );
}
