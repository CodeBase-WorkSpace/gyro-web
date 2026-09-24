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

export default function WeightExplorerError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("weight-explorer-route-error", error);
	}, [error]);

	return (
		<main id="main-content" className="grid min-h-svh place-items-center bg-background px-4 text-foreground">
			<Card className="w-full max-w-md rounded-3xl border bg-card shadow-sm">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg font-semibold">
						<AlertTriangleIcon data-icon="inline-start" />
						تحلیل وزن باز نشد
					</CardTitle>
					<CardDescription className="leading-7">
						خطای غیرمنتظره‌ای در نمایش صفحه رخ داد. می‌توانید دوباره تلاش کنید یا به صفحه پیشرفت برگردید.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-wrap gap-2">
					<button type="button" className={buttonVariants()} onClick={reset}>
						تلاش دوباره
					</button>
					<Link href="/progress" className={buttonVariants({ variant: "outline" })}>
						بازگشت به پیشرفت
					</Link>
				</CardContent>
			</Card>
		</main>
	);
}
