import {Skeleton} from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-8">
      <main
        id="main-content"
        className="flex min-w-0 flex-1 flex-col gap-6"
        aria-label="در حال بارگذاری داشبورد روزانه"
      >
        <Skeleton className="h-20 rounded-2xl" />
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="order-first h-96 rounded-2xl xl:order-0" />
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </section>
      </main>
    </div>
  );
}
