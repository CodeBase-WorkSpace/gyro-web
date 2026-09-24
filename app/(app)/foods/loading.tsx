import {AppTopBar} from "@/components/design-system/app-top-bar";
import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {Skeleton} from "@/components/ui/skeleton";

export default function FoodsLoading() {
  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-8"
      aria-label="در حال بارگذاری غذاها و دفتر غذایی"
    >
      <AppTopBar
        title="غذاها"
        description="در حال خواندن دفتر غذایی"
        backLink={{href: "/dashboard", label: "بازگشت به داشبورد امروز"}}
      />

      <Skeleton className="h-56 rounded-3xl" />
      <Card className="rounded-3xl border bg-card shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-40 rounded-full" />
          <Skeleton className="h-4 w-64 rounded-full" />
        </CardHeader>
        <CardContent className="grid gap-3">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </CardContent>
      </Card>
    </main>
  );
}
