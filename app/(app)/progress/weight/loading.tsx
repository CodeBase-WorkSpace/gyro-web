import { AppTopBar } from "@/components/design-system/app-top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function WeightExplorerLoading() {
	return (
		<div className="mx-auto flex w-full max-w-7xl px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-10">
				<main
					id="main-content"
					className="flex min-w-0 flex-1 flex-col gap-6"
					aria-label="در حال بارگذاری تحلیل وزن"
				>
					<AppTopBar
						title="تحلیل وزن"
						description="در حال خواندن بازه وزن"
						backLink={{ href: "/progress", label: "بازگشت به پیشرفت" }}
						showDateControl={false}
						showMobileDateAction={false}
					/>

					<Skeleton className="h-24 rounded-2xl" />

					<div className="grid gap-4 md:grid-cols-4">
						{["وزن شروع", "وزن پایان", "تغییر", "اندازه‌گیری"].map((label) => (
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
					</div>

					<Card className="rounded-2xl border bg-card/80 shadow-sm">
						<CardHeader>
							<Skeleton className="h-5 w-36" />
							<Skeleton className="h-4 w-72" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-60 w-full" />
						</CardContent>
					</Card>
				</main>
		</div>
	);
}
