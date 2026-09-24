import { Skeleton } from "@/components/ui/skeleton";

export default function FoodDetailLoading() {
	return (
		<main id="main-content" className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8" aria-label="در حال بارگذاری جزئیات غذا">
			<Skeleton className="h-20 rounded-2xl" />
			<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
				<div className="flex flex-col gap-4"><Skeleton className="h-44 rounded-3xl" /><Skeleton className="h-64 rounded-3xl" /><Skeleton className="h-52 rounded-3xl" /></div>
				<Skeleton className="h-72 rounded-3xl" />
			</div>
		</main>
	);
}
