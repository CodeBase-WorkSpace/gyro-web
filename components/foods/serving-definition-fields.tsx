"use client";

import { MinusIcon, PlusIcon, ScaleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldSet,
	FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	parseServingDefinitionDraft,
	type ServingDefinitionDraft,
	servingsPerBatch,
} from "@/lib/foods/serving-definition";
import { toPersianDigits } from "@/lib/format";

export function ServingDefinitionFields({
	idPrefix,
	draft,
	totalBatchWeight,
	disabled,
	error,
	totalCalories,
	onChange,
}: {
	idPrefix: string;
	draft: ServingDefinitionDraft;
	totalBatchWeight: number | null;
	disabled?: boolean;
	error?: string | null;
	totalCalories?: number | null;
	onChange: (draft: ServingDefinitionDraft) => void;
}) {
	const parsed = parseServingDefinitionDraft(draft, totalBatchWeight);
	const values = parsed.values;
	const count = Number(draft.servingCountInput);

	function changeCount(delta: number) {
		const current = Number.isInteger(count) && count >= 1 ? count : 1;
		onChange({ servingCountInput: String(Math.max(1, current + delta)) });
	}

	return (
		<FieldSet className="rounded-2xl border bg-muted/25 p-4">
			<FieldTitle className="mb-1.5 text-base font-medium">
				تقسیم وعده به سروینگ
			</FieldTitle>
			<FieldDescription className="mb-4 leading-6 text-start">
				وزن کل را از مقدار همه غذاهای انتخاب‌شده محاسبه می‌کنیم.
				پیش‌فرض، کل ترکیب یک سروینگ است؛ اگر آن را برای چند وعده آماده
				کرده‌اید، تعداد سروینگ‌ها را بیشتر کنید.
			</FieldDescription>

			<FieldGroup className="gap-4">
				<div className="flex items-center justify-between gap-3 rounded-2xl border bg-background p-3">
					<div className="flex min-w-0 items-center gap-3">
						<span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
							<ScaleIcon className="size-5" aria-hidden="true" />
						</span>
						<div className="min-w-0">
							<p className="text-sm font-bold">وزن کل وعده</p>
							<p className="text-xs text-muted-foreground">
								جمع خودکار مقدار همه اجزا
							</p>
						</div>
					</div>
					<strong className="shrink-0 tabular-nums">
						{totalBatchWeight === null
							? "نامشخص"
							: `${toPersianDigits(formatWeight(totalBatchWeight))} گرم`}
					</strong>
				</div>

				<Field data-invalid={Boolean(error || parsed.error)}>
					<FieldLabel htmlFor={`${idPrefix}-serving-count`}>
						تعداد سروینگ
					</FieldLabel>
					<div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-2">
						<Button
							type="button"
							variant="outline"
							size="icon-lg"
							className="rounded-xl"
							disabled={disabled || count <= 1}
							aria-label="کم کردن یک سروینگ"
							onClick={() => changeCount(-1)}
						>
							<MinusIcon />
						</Button>
						<Input
							id={`${idPrefix}-serving-count`}
							value={draft.servingCountInput}
							inputMode="numeric"
							dir="ltr"
							disabled={disabled}
							aria-invalid={Boolean(error || parsed.error)}
							className="h-11 rounded-xl text-center tabular-nums"
							onChange={(event) =>
								onChange({
									servingCountInput:
										event.currentTarget.value,
								})
							}
						/>
						<Button
							type="button"
							variant="outline"
							size="icon-lg"
							className="rounded-xl"
							disabled={disabled || count >= 1000}
							aria-label="افزودن یک سروینگ"
							onClick={() => changeCount(1)}
						>
							<PlusIcon />
						</Button>
					</div>
				</Field>
			</FieldGroup>

			{error || parsed.error ? (
				<p className="mt-3 text-sm text-destructive" role="alert">
					{error ?? parsed.error}
				</p>
			) : values ? (
				<p className="mt-3 text-sm text-muted-foreground">
					{`${toPersianDigits(formatServings(servingsPerBatch(values)))} سروینگ، هر کدام حدود ${toPersianDigits(formatWeight(values.servingWeight))} گرم`}
					{typeof totalCalories === "number" && totalCalories > 0
						? ` و ${toPersianDigits(Math.round(totalCalories / servingsPerBatch(values)))} کالری`
						: ""}
				</p>
			) : null}
		</FieldSet>
	);
}

export function servingDefinitionSummaryText(
	values: { totalBatchWeight: number; servingWeight: number } | null,
): string | null {
	if (!values) return null;
	return `${toPersianDigits(formatWeight(values.totalBatchWeight))} گرم کل · ${toPersianDigits(formatServings(values.totalBatchWeight / values.servingWeight))} سروینگ · هر سروینگ ${toPersianDigits(formatWeight(values.servingWeight))} گرم`;
}

function formatServings(value: number): string {
	return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatWeight(value: number): string {
	return Number.isInteger(value)
		? String(value)
		: value.toFixed(2).replace(/\.?0+$/, "");
}
