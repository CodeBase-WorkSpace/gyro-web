import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {Skeleton} from "@/components/ui/skeleton";

export default function BillingLoading() {
  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10"
      aria-label="در حال بارگذاری اشتراک و صورتحساب"
    >
      <Skeleton className="h-24 rounded-3xl"/>
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="rounded-3xl border bg-card shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-48 rounded-full"/>
            <Skeleton className="h-4 w-full rounded-full"/>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Skeleton className="h-16 rounded-2xl"/>
            <Skeleton className="h-16 rounded-2xl"/>
            <Skeleton className="h-16 rounded-2xl"/>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border bg-card shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-36 rounded-full"/>
            <Skeleton className="h-4 w-full rounded-full"/>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Skeleton className="h-10 rounded-full"/>
            <Skeleton className="h-10 rounded-full"/>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
