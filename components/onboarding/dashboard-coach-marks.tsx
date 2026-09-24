"use client";

import { useEffect } from "react";

import { useQueuedDialog } from "@/components/dialog-queue/dialog-queue-provider";
import { CoachMark } from "@/components/onboarding/coach-mark";
import type { DashboardPromptId } from "@/lib/onboarding/prompt-coordinator";

type CoachMarkStep = Extract<
	DashboardPromptId,
	| "first-meal-guidance"
	| "first-log-celebration"
	| "quick-add-guidance"
	| "explore-progress"
	| "profile-settings-guidance"
>;

export function DashboardCoachMarks({
	step,
	hasConfiguredGoal,
	onShown,
	onDismiss,
}: {
	step: CoachMarkStep | null;
	hasConfiguredGoal: boolean;
	onShown: () => void;
	onDismiss: () => void;
}) {
	const { open, complete } = useQueuedDialog(
		"dashboard-first-meal-guidance",
		20,
		step !== null,
	);

	useEffect(() => {
		if (open) onShown();
	}, [onShown, open]);

	if (!open || !step) return null;

	function dismiss() {
		onDismiss();
		complete();
	}

	if (step === "first-meal-guidance") {
		return (
			<CoachMark
				target="foods-nav"
				title="اولین غذات را ثبت کن"
				body={
					hasConfiguredGoal
						? "از اینجا اولین غذای امروزت را ثبت کن تا کالری و ماکروهایت روی داشبورد نمایش داده شوند."
						: "از اینجا اولین غذای امروزت را ثبت کن. هر زمان خواستی، می‌تونی بعداً هدفت را هم بسازی."
				}
				onDismiss={dismiss}
			/>
		);
	}

	if (step === "first-log-celebration") {
		return (
			<CoachMark
				target="foods-nav"
				title="اولین غذات ثبت شد!"
				body="از اینجا می‌تونی غذاهای امروزت را ببینی، ویرایش کنی یا غذای جدیدی ثبت کنی."
				onDismiss={dismiss}
			/>
		);
	}

	if (step === "quick-add-guidance") {
		return (
			<CoachMark
				target="quick-add"
				title="ثبت‌های بعدی را سریع‌تر انجام بده"
				body="از این دکمه می‌تونی غذا، وزن یا موارد سفارشی را بدون رفتن به صفحه‌ای دیگر ثبت کنی."
				onDismiss={dismiss}
			/>
		);
	}

	if (step === "explore-progress") {
		return (
			<CoachMark
				target="progress-nav"
				title="پیشرفتت را ببین"
				body="روند وزن، کالری و امتیاز روزانه‌ات اینجاست تا تغییراتت را راحت‌تر دنبال کنی."
				onDismiss={dismiss}
			/>
		);
	}

	return (
		<CoachMark
			target="profile-nav"
			title="تنظیماتت همیشه در دسترس است"
			body="از اینجا می‌تونی پروفایل، یادآوری‌ها، اعلان‌ها و اشتراکت را مدیریت کنی."
			onDismiss={dismiss}
		/>
	);
}
