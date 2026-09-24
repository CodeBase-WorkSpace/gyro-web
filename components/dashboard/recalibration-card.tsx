"use client";

import { useState, useTransition } from "react";
import { RefreshCcwIcon, SparklesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
	acceptRecalibrationAction,
	dismissRecalibrationAction,
} from "@/app/_actions/recalibration";
import { RecalibrationEvidencePanel } from "@/components/dashboard/recalibration-evidence-panel";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type {
	RecalibrationDismissReason,
	RecalibrationSuggestionDto,
} from "@/lib/api/recalibration";
import { formatPersianNumber, toPersianDigits } from "@/lib/format";
import {
	parseRecalibrationRecommendationStory,
	recalibrationRecommendationCopy,
} from "@/lib/nutrition-coach/evidence-copy";
import { parseRecalibrationDisclosure } from "@/lib/recalibration/evidence";

const dismissReasons: Array<{
	value: RecalibrationDismissReason;
	label: string;
}> = [
	{ value: "TOO_AGGRESSIVE", label: "تغییر پیشنهادی زیاد است" },
	{ value: "DOESNT_FEEL_RIGHT", label: "این پیشنهاد درست به نظر نمی‌رسد" },
	{ value: "DATA_IS_WRONG", label: "ثبت‌هایم دقیق نیست" },
	{ value: "NOT_NOW", label: "فعلاً زمانش نیست" },
];

/**
 * Suggest + confirm check-in: the system never changes targets on its own.
 * Both decisions remove the suggestion; a stale one (plan edited meanwhile)
 * reports itself and disappears.
 *
 * `embedded` drops the card shell and heading so the nutrition coach card can host
 * this as one of its states rather than replacing itself with a second card. The
 * accept/dismiss controls live here either way — they are the only writers.
 */
export function RecalibrationCard({
	suggestion,
	embedded = false,
}: {
	suggestion: RecalibrationSuggestionDto;
	embedded?: boolean;
}) {
	const router = useRouter();
	const [pending, startTransition] = useTransition();
	const [decided, setDecided] = useState(false);
	const [dismissOpen, setDismissOpen] = useState(false);
	const [dismissReason, setDismissReason] =
		useState<RecalibrationDismissReason>();

	if (decided) return null;

	const from = Math.round(suggestion.previous.calories);
	const to = Math.round(suggestion.suggested.calories);
	const increase = to > from;
	const observedRate = String(suggestion.basis["observedKgPerWeek"] ?? "");
	const recommendationStory = parseRecalibrationRecommendationStory(
		suggestion.basis,
	);
	const recommendationStoryCopy = recommendationStory
		? recalibrationRecommendationCopy(
				recommendationStory,
				suggestion.previous.calories,
				suggestion.suggested.calories,
			)
		: null;
	const disclosure = parseRecalibrationDisclosure(
		suggestion.basis,
		suggestion.previous.calories,
		suggestion.suggested.calories,
	);

	function decide(action: "accept" | "dismiss") {
		startTransition(async () => {
			const result =
				action === "accept"
					? await acceptRecalibrationAction(suggestion.id)
					: await dismissRecalibrationAction(
							suggestion.id,
							dismissReason,
						);

			if (result.ok) {
				if (result.message) toast.success(result.message);
				setDecided(true);
				router.refresh();
			} else {
				toast.error(result.message ?? "این کار انجام نشد. دوباره تلاش کن.");
			}
		});
	}

	const body = (
		<>
			<p className="text-sm leading-7 text-muted-foreground">
				{recommendationStoryCopy ?? (
					<>
						بر اساس روند وزن دو هفته اخیرت
						{observedRate
							? ` (${toPersianDigits(observedRate)} کیلوگرم در هفته)`
							: ""}
						، پیشنهاد می‌کنیم هدف کالری روزانه‌ات از{" "}
						<strong className="text-foreground">
							{toPersianDigits(from)}
						</strong>{" "}
						به{" "}
						<strong className="text-foreground">
							{toPersianDigits(to)}
						</strong>{" "}
						کالری {increase ? "افزایش" : "کاهش"} پیدا کند. ماکروها
						هم متناسب با آن تنظیم می‌شوند.
					</>
				)}
			</p>
			{disclosure ? <Disclosure disclosure={disclosure} /> : null}
			<RecalibrationEvidencePanel
				basis={suggestion.basis}
				suggestedCalories={suggestion.suggested.calories}
			/>
			{dismissOpen ? (
				<div className="mt-4 rounded-xl border border-border/70 bg-background/55 p-3">
					<p className="text-sm font-bold">
						اگر خواستی، دلیلش را انتخاب کن
						<span className="mr-1 font-normal text-muted-foreground">
							(اختیاری)
						</span>
					</p>
					<div className="mt-2 flex flex-wrap gap-2">
						{dismissReasons.map((reason) => (
							<Button
								key={reason.value}
								type="button"
								variant={
									dismissReason === reason.value
										? "choice-selected"
										: "outline"
								}
								size="sm"
								className="rounded-full"
								disabled={pending}
								aria-pressed={dismissReason === reason.value}
								onClick={() =>
									setDismissReason((current) =>
										current === reason.value
											? undefined
											: reason.value,
									)
								}
							>
								{reason.label}
							</Button>
						))}
					</div>
					<div className="mt-3 flex flex-wrap gap-2">
						<Button
							type="button"
							variant="ghost"
							size="lg"
							className="h-10 rounded-full"
							disabled={pending}
							onClick={() => decide("dismiss")}
						>
							{pending ? <Spinner /> : null}
							رد پیشنهاد
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="lg"
							className="h-10 rounded-full"
							disabled={pending}
							onClick={() => {
								setDismissOpen(false);
								setDismissReason(undefined);
							}}
						>
							انصراف
						</Button>
					</div>
				</div>
			) : (
				<div className="mt-3 flex flex-wrap items-center gap-2">
					<Button
						type="button"
						size="lg"
						className="h-10 rounded-full"
						disabled={pending}
						onClick={() => decide("accept")}
					>
						{pending ? (
							<Spinner />
						) : (
							<SparklesIcon data-icon="inline-start" />
						)}
						اعمال کن
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="lg"
						className="h-10 rounded-full"
						disabled={pending}
						onClick={() => setDismissOpen(true)}
					>
						فعلاً نه
					</Button>
				</div>
			)}
		</>
	);

	if (embedded) return <div className="mt-4">{body}</div>;

	return (
		<section
			className="rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3 shadow-sm"
			aria-label="پیشنهاد به‌روزرسانی هدف"
		>
			<div className="flex items-start gap-2">
				<RefreshCcwIcon
					className="mt-1 size-4 shrink-0 text-primary"
					aria-hidden="true"
				/>
				<div className="min-w-0 text-sm leading-7">
					<strong>پیشنهاد به‌روزرسانی برنامه</strong>
					{body}
				</div>
			</div>
		</section>
	);
}

function Disclosure({
	disclosure,
}: {
	disclosure: NonNullable<ReturnType<typeof parseRecalibrationDisclosure>>;
}) {
	const computed = formatPersianNumber(Math.round(disclosure.computedTarget));
	const applied = formatPersianNumber(Math.round(disclosure.appliedTarget));

	if (disclosure.kind === "floor") {
		const capped =
			disclosure.cappedTarget === null
				? null
				: formatPersianNumber(Math.round(disclosure.cappedTarget));
		return (
			<p className="mt-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm leading-7">
				بر اساس محاسبات، هدف این بازه {computed} کالری است.
				{capped === null
					? " "
					: ` برای اینکه تغییر تدریجی باشد، این عدد به ${capped} کالری محدود می‌شود. با این حال، `}
				هدف برنامه از {formatPersianNumber(Math.round(disclosure.floor))}{" "}
				کالری پایین‌تر نمی‌رود. اگر هنوز به تغییر بیشتری نیاز باشد،
				زمان‌بندی هدف را دوباره بررسی می‌کنیم.
			</p>
		);
	}

	return (
		<p className="mt-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm leading-7">
			بر اساس محاسبات، هدف این بازه {computed} کالری است. برای اینکه تغییر
			تدریجی باشد، این هفته هدف را به {applied} کالری می‌رسانیم و هفته بعد
			دوباره بررسی می‌کنیم.
		</p>
	);
}
