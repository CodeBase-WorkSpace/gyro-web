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
 * Keeps a failed dashboard render inside the app shell.
 *
 * Without this file the nearest boundary is the root one, which replaces the
 * whole application — nav included — so the only way back is a browser reload.
 * That is the path a failed post-write re-render used to take: the diary entry
 * was already saved, and the refresh that followed destroyed the page anyway.
 */
export default function DashboardError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(
			`event=route_render outcome=failure route=dashboard digest=${error.digest ?? "none"}`,
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
						داشبورد بارگذاری نشد
					</CardTitle>
					<CardDescription className="leading-7">
						نمایش داشبورد با خطا روبه‌رو شد. اگر غذایی ثبت کرده‌اید، ثبت آن
						انجام شده و از بین نرفته است. می‌توانید دوباره تلاش کنید.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-wrap gap-2">
					<button type="button" className={buttonVariants()} onClick={reset}>
						تلاش دوباره
					</button>
					<Link
						href="/foods"
						className={buttonVariants({ variant: "outline" })}
					>
						رفتن به غذاها
					</Link>
				</CardContent>
			</Card>
		</main>
	);
}
