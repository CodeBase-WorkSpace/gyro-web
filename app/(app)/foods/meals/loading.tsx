import { Skeleton } from "@/components/ui/skeleton";

export default function MealsLoading() {
	return (
		<main id="main-content" className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8" aria-label="در حال بارگذاری وعده‌های سفارشی">
			<Skeleton className="h-24 rounded-2xl" />
			<Skeleton className="h-11 rounded-xl" />
			<div className="grid gap-3 sm:grid-cols-2">
				{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-2xl" />)}
			</div>
		</main>
	);
}
