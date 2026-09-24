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
 * Keeps a failed foods render inside the app shell.
 *
 * This route loads a whole week of diary days, so it has the most reads of any
 * page and the most ways to fail. Without a boundary here every one of those
 * reads could take down the entire application.
 */
export default function FoodsError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(
			`event=route_render outcome=failure route=foods digest=${error.digest ?? "none"}`,
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
						صفحه غذاها باز نشد
					</CardTitle>
					<CardDescription className="leading-7">
						دریافت دفتر غذایی این هفته ناموفق بود. اگر غذایی ثبت کرده‌اید، ثبت
						آن انجام شده و از بین نرفته است.
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
