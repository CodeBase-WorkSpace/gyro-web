import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<main className="min-h-svh bg-background px-4 py-5 text-foreground sm:px-6 lg:px-8">
			<div className="mx-auto grid w-full max-w-7xl gap-4 xl:grid-cols-12">
				<Skeleton className="h-20 rounded-2xl xl:col-span-12" />
				<Skeleton className="order-first h-96 rounded-2xl xl:order-0 xl:col-span-4" />
				<Skeleton className="h-96 rounded-2xl xl:col-span-4" />
				<Skeleton className="h-56 rounded-2xl xl:col-span-4" />
			</div>
		</main>
	);
}
