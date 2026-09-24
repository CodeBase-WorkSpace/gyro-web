import {AppTopBar} from "@/components/design-system/app-top-bar";
import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {Skeleton} from "@/components/ui/skeleton";

export default function GoalsLoading() {
  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10"
      aria-label="در حال بارگذاری اهداف تغذیه"
    >
      <AppTopBar
        title="اهداف تغذیه"
        description="در حال خواندن هدف فعال"
        backLink={{href: "/progress", label: "بازگشت به پیشرفت"}}
        showDateControl={false}
        showMobileDateAction={false}
      />

      <Card className="rounded-3xl border bg-card shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-48 rounded-full" />
          <Skeleton className="h-4 w-72 rounded-full" />
        </CardHeader>
        <CardContent className="grid gap-4">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </CardContent>
      </Card>
    </main>
  );
}
