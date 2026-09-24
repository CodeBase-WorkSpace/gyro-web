"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CalculatorIcon } from "lucide-react";
import { toast } from "sonner";

import { acknowledgeCalculatorRerunPromptAction } from "@/app/(app)/dashboard/actions";
import { Button } from "@/components/ui/button";
import { calculatorRerunPromptOutcome } from "@/lib/nutrition-coach/calculator-rerun";

const GOAL_WIZARD_PATH = "/progress/goals?wizard=1";

export function CalculatorRerunCta() {
	const router = useRouter();
	const [visible, setVisible] = useState(true);
	const [pending, startTransition] = useTransition();

	function startWizard() {
		startTransition(async () => {
			const result = await acknowledgeCalculatorRerunPromptAction();
			const outcome = calculatorRerunPromptOutcome(
				"START_WIZARD",
				result.ok,
			);
			if (outcome.hidePrompt) setVisible(false);
			if (outcome.navigateToWizard) router.push(GOAL_WIZARD_PATH);
		});
	}

	function dismiss() {
		startTransition(async () => {
			const result = await acknowledgeCalculatorRerunPromptAction();
			const outcome = calculatorRerunPromptOutcome("DISMISS", result.ok);
			if (!result.ok) {
				toast.error(result.message);
				return;
			}
			if (outcome.hidePrompt) setVisible(false);
		});
	}

	if (!visible) return null;

	return (
		<aside
			className="mt-4 rounded-2xl border border-primary/25 bg-primary/8 p-3"
			aria-label="فعال‌سازی تحلیل هدف"
		>
			<div className="flex items-start gap-3">
				<span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-primary/12 text-primary">
					<CalculatorIcon className="size-4" aria-hidden="true" />
				</span>
				<div className="min-w-0 flex-1">
					<p className="text-sm font-bold">
						تحلیل دقیق‌تر هدفت را فعال کن
					</p>
					<p className="mt-1 text-sm leading-7 text-muted-foreground">
						برای فعال‌شدن بررسی روند و پیشنهادهای هدف، محاسبه‌گر را
						یک‌بار دیگر اجرا کن.
					</p>
				</div>
			</div>
			<div className="mt-3 flex justify-end gap-2">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					disabled={pending}
					onClick={dismiss}
				>
					فعلاً نه
				</Button>
				<Button
					type="button"
					size="sm"
					disabled={pending}
					onClick={startWizard}
				>
					اجرای دوباره محاسبه‌گر
				</Button>
			</div>
		</aside>
	);
}
