import {AppTopBar} from "@/components/design-system/app-top-bar";
import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {Skeleton} from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-8"
      aria-label="در حال بارگذاری پروفایل و تنظیمات"
    >
      <AppTopBar
        title="پروفایل و تنظیمات"
        description="در حال خواندن تنظیمات حساب"
        backLink={{href: "/dashboard", label: "بازگشت به امروز"}}
      />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="rounded-3xl border bg-card shadow-sm">
          <CardHeader>
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-6 w-40 rounded-full" />
            <Skeleton className="h-4 w-64 rounded-full" />
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({length: 6}).map((_, index) => (
              <Skeleton key={index} className="h-16 rounded-2xl" />
            ))}
          </CardContent>
        </Card>
        <Skeleton className="h-96 rounded-3xl" />
      </section>
    </main>
  );
}
