"use client";

import { AlertTriangleIcon } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { buttonVariants } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

/**
 * Keeps a failed progress render inside the app shell.
 *
 * The weight and nutrition explorers nested under this route already have their
 * own boundaries; this covers the progress overview itself, which reads all
 * three progress endpoints at once.
 */
export default function ProgressError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(
			`event=route_render outcome=failure route=progress digest=${error.digest ?? "none"}`,
			error,
		);
	}, [error]);

	return (
		<main
			id="main-content"
			className="grid min-h-svh place-items-center bg-background px-4 text-foreground"
		>
			<Card className="w-full max-w-md rounded-3xl border bg-card shadow-sm">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg font-semibold">
						<AlertTriangleIcon data-icon="inline-start" />
						صفحه پیشرفت باز نشد
					</CardTitle>
					<CardDescription className="leading-7">
						دریافت گزارش پیشرفت ناموفق بود. داده‌های شما تغییری نکرده است و
						می‌توانید دوباره تلاش کنید.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-wrap gap-2">
					<button type="button" className={buttonVariants()} onClick={reset}>
						تلاش دوباره
					</button>
					<Link
						href="/dashboard"
						className={buttonVariants({ variant: "outline" })}
					>
						بازگشت به داشبورد
					</Link>
				</CardContent>
			</Card>
		</main>
	);
}
