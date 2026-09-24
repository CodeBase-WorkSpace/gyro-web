"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	AlertTriangleIcon,
	CheckCircle2Icon,
	Loader2Icon,
	XCircleIcon,
} from "lucide-react";

import type { PaymentReturnStatus } from "@/lib/api/payping";
import { buttonVariants } from "@/components/ui/button";
import {CelebrationConfetti} from "@/components/ui/celebration-confetti";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

type PaymentReturnPanelProps = {
	initialStatus: PaymentReturnStatus;
};

export function PaymentReturnPanel({ initialStatus }: PaymentReturnPanelProps) {
	const router = useRouter();
	const [isPendingTransition, startTransition] = useTransition();
	const [status, setStatus] = useState(initialStatus);
	const copy = useMemo(() => copyForStatus(status), [status]);

	useEffect(() => {
		setStatus(initialStatus);
	}, [initialStatus]);

	useEffect(() => {
		if (status.state !== "PENDING" || !status.paymentAttemptId) return;

		const interval = window.setInterval(() => {
			router.refresh();
		}, 3000);

		return () => window.clearInterval(interval);
	}, [router, status.paymentAttemptId, status.state]);

	useEffect(() => {
		if (status.state !== "SUCCESS") return;

		startTransition(() => {
			router.refresh();
		});
	}, [router, status.state]);

	const Icon = copy.icon;

	return (
		<>
			<CelebrationConfetti active={status.state === "SUCCESS"}/>
		<Card className="overflow-hidden rounded-3xl border bg-card shadow-sm">
			<CardHeader>
				<CardTitle className="flex items-center gap-3 text-lg font-semibold">
					<span className={copy.badgeClass} aria-hidden="true">
						<span className={copy.pulseClass} />
						<Icon
							className={copy.iconClass}
							data-icon="inline-start"
						/>
					</span>
					<span>{copy.title}</span>
				</CardTitle>
				<CardDescription className="leading-7">
					{copy.description}
				</CardDescription>
			</CardHeader>
			<CardContent className="grid gap-3">
				{status.state === "PENDING" ? (
					<div className="flex items-center gap-2 rounded-2xl border bg-background/45 p-3 text-sm font-bold">
						<Loader2Icon
							className="motion-safe:animate-spin"
							data-icon="inline-start"
						/>
						در حال تأیید پرداخت...
					</div>
				) : null}

				<div className="grid gap-2 rounded-2xl border bg-background/45 p-3 text-sm leading-7 text-muted-foreground">
					<p>{copy.detail}</p>
					{status.clientRefId ? (
						<p>
							<span className="font-bold text-foreground">
								شناسه پرداخت:{" "}
							</span>
							<bdi className="break-all font-mono text-foreground">{status.clientRefId}</bdi>
						</p>
					) : null}
					{status.requestId ? (
						<p>
							<span className="font-bold text-foreground">
								کد پیگیری پشتیبانی:{" "}
							</span>
							<bdi>{status.requestId}</bdi>
						</p>
					) : null}
				</div>
			</CardContent>
			<CardFooter className="flex flex-wrap justify-end gap-2">
				{copy.showRetry ? (
					<Link
						href="/profile/billing"
						className={buttonVariants({ variant: "outline" })}
					>
						تلاش دوباره
					</Link>
				) : null}
				{copy.showSupport ? (
					<Link
						href="/account/recovery"
						className={buttonVariants({ variant: "outline" })}
					>
						تماس با پشتیبانی
					</Link>
				) : null}
				{status.state === "SUCCESS" ? (
					<>
						<Link
							href="/profile/billing"
							className={buttonVariants({ variant: "outline" })}
							aria-disabled={isPendingTransition}
						>
							مشاهده اشتراک
						</Link>
						<Link
							href="/dashboard"
							className={buttonVariants({ variant: "default" })}
						>
							رفتن به داشبورد
						</Link>
					</>
				) : null}
			</CardFooter>
		</Card>
		</>
	);
}

function copyForStatus(status: PaymentReturnStatus) {
	switch (status.state) {
		case "SUCCESS":
			return {
				title: "پرداخت تأیید شد! اشتراک پیشرفته فعال شد.",
				description:
					"وضعیت اشتراک به‌روزرسانی شد. می‌توانی همین‌جا نتیجه را نگه داری یا به داشبورد برگردی.",
				detail: "قابلیت‌های پیشرفته برای حساب شما فعال است.",
				icon: CheckCircle2Icon,
				iconClass: "relative z-10 size-7 text-primary",
				badgeClass:
					"relative grid size-12 place-items-center rounded-full bg-primary/10",
				pulseClass:
					"absolute inset-0 rounded-full bg-primary/20 motion-safe:animate-ping motion-reduce:hidden",
				showRetry: false,
				showSupport: false,
			};
		case "PENDING":
			return {
				title: "در حال تأیید پرداخت...",
				description:
					"تأیید پرداخت طول می‌کشد. اگر مبلغی کسر شده باشد، طی چند دقیقه بررسی می‌شود.",
				detail: "تا وقتی تأیید نهایی از سرور دریافت نشود، اشتراک فعال نمی‌شود.",
				icon: Loader2Icon,
				iconClass:
					"relative z-10 size-7 text-primary motion-safe:animate-spin",
				badgeClass:
					"relative grid size-12 place-items-center rounded-full bg-primary/10",
				pulseClass:
					"absolute inset-0 rounded-full bg-primary/20 motion-safe:animate-ping motion-reduce:hidden",
				showRetry: false,
				showSupport: true,
			};
		case "ABANDONED":
			return {
				title: "پرداخت تکمیل نشد",
				description:
					"پرداخت کامل نشد. می‌توانید دوباره از صفحه اشتراک تلاش کنید.",
				detail: "اگر از حساب شما مبلغی کسر نشده، کافی است پرداخت را دوباره شروع کنید.",
				icon: XCircleIcon,
				iconClass: "relative z-10 size-7 text-muted-foreground",
				badgeClass:
					"relative grid size-12 place-items-center rounded-full bg-muted",
				pulseClass: "hidden",
				showRetry: true,
				showSupport: false,
			};
		case "FAILED":
			return {
				title: "پرداخت قابل تأیید نبود",
				description:
					"پرداخت قابل تأیید نبود. اگر مبلغی کسر شده باشد، با پشتیبانی تماس بگیرید.",
				detail: "این وضعیت یعنی تأیید قطعی نشد؛ برای بررسی پرداخت کد پیگیری را به پشتیبانی بدهید.",
				icon: AlertTriangleIcon,
				iconClass: "relative z-10 size-7 text-destructive",
				badgeClass:
					"relative grid size-12 place-items-center rounded-full bg-destructive/10",
				pulseClass:
					"absolute inset-0 rounded-full bg-destructive/20 motion-safe:animate-ping motion-reduce:hidden",
				showRetry: true,
				showSupport: true,
			};
		case "SUPPORT_NEEDED":
			return {
				title: "برای بررسی پرداخت با پشتیبانی تماس بگیرید",
				description: "وضعیت پرداخت به بررسی پشتیبانی نیاز دارد.",
				detail: "برای پیگیری، فقط کد پیگیری پشتیبانی را ارسال کنید؛ اطلاعات کارت یا شناسه‌های درگاه را نفرستید.",
				icon: AlertTriangleIcon,
				iconClass: "relative z-10 size-7 text-destructive",
				badgeClass:
					"relative grid size-12 place-items-center rounded-full bg-destructive/10",
				pulseClass:
					"absolute inset-0 rounded-full bg-destructive/20 motion-safe:animate-ping motion-reduce:hidden",
				showRetry: false,
				showSupport: true,
			};
		case "CONFIRMING":
		default:
			return {
				title: "در حال تأیید پرداخت...",
				description:
					"لطفا چند لحظه صبر کنید تا نتیجه پرداخت از سرور بررسی شود.",
				detail: "نتیجه پرداخت فقط بعد از تأیید امن سرور نمایش داده می‌شود.",
				icon: Loader2Icon,
				iconClass:
					"relative z-10 size-7 text-primary motion-safe:animate-spin",
				badgeClass:
					"relative grid size-12 place-items-center rounded-full bg-primary/10",
				pulseClass:
					"absolute inset-0 rounded-full bg-primary/20 motion-safe:animate-ping motion-reduce:hidden",
				showRetry: false,
				showSupport: false,
			};
	}
}
