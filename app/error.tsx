"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary for any route without one of its own.
 *
 * It used to carry diary-specific copy, which meant a failure in billing or
 * marketing told the user their food diary had not loaded. Routes that can say
 * something more useful should own an error.tsx rather than widening this one.
 */
export default function AppError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(
			`event=route_render outcome=failure route=root digest=${error.digest ?? "none"}`,
			error,
		);
	}, [error]);

	return (
		<main className="grid min-h-svh place-items-center bg-background p-6 text-foreground">
			<section className="max-w-md rounded-2xl border bg-card p-6 text-center shadow-sm">
				<h1 className="text-lg font-bold">صفحه بارگذاری نشد</h1>
				<p className="mt-2 text-sm leading-6 text-muted-foreground">
					خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید.
				</p>
				<button
					type="button"
					onClick={reset}
					className="mt-5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
				>
					تلاش دوباره
				</button>
			</section>
		</main>
	);
}
