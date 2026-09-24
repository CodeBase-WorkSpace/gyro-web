"use client";

import {PencilIcon} from "lucide-react";
import {startTransition, useEffect, useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";

import {updateDiaryEntryAction} from "@/app/_actions/quick-add";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {Field, FieldGroup, FieldLabel} from "@/components/ui/field";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger} from "@/components/ui/select";
import {Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {Spinner} from "@/components/ui/spinner";
import {
	diaryMealLabelForType,
	diaryMealOptions,
	quickAddMealTypeByLabel,
	type CreateDiaryEntryRequestDto,
	type DiaryEntrySummary,
	type DiaryMealType,
} from "@/lib/api/diary";
import type {FoodDetailDto} from "@/lib/api/foods";
import type {MealDetailDto} from "@/lib/api/meals";
import {parseQuickAddAmount, quickAddServingOptions} from "@/lib/diary/quick-add";

type Source = FoodDetailDto | MealDetailDto;

export function DiaryEntryEditControl({date, entry, disabled = false}: { date: string; entry: DiaryEntrySummary; disabled?: boolean }) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [source, setSource] = useState<Source | null>(null);
	const [sourceError, setSourceError] = useState<string | null>(null);
	const [loadingSource, setLoadingSource] = useState(false);
	const [mealLabel, setMealLabel] = useState(diaryMealLabelForType(entry.mealType));
	const [amountInput, setAmountInput] = useState(String(entry.servingQuantity));
	const [servingOptionId, setServingOptionId] = useState("");
	const [message, setMessage] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [intentId, setIntentId] = useState(() => createEditIntentId());

	const foodSource = entry.sourceType === "FOOD" ? source as FoodDetailDto | null : null;
	const servingOptions = useMemo(() => foodSource ? quickAddServingOptions(foodSource) : [], [foodSource]);
	const selectedOption = servingOptions.find((option) => option.id === servingOptionId) ?? null;

	useEffect(() => {
		if (!open || entry.sourceType === "MANUAL") return;
		const sourceId = entry.sourceType === "FOOD" ? entry.sourceFoodId : entry.sourceMealId;
		if (!sourceId) return;
		const controller = new AbortController();
		setLoadingSource(true);
		setSource(null);
		setSourceError(null);
		fetch(`/api/${entry.sourceType === "FOOD" ? "foods" : "meals"}/${encodeURIComponent(sourceId)}`, { signal: controller.signal })
			.then(async (response) => {
				if (!response.ok) throw new Error((await response.json().catch(() => null))?.message ?? "منبع ثبت دیگر در دسترس نیست.");
				return response.json() as Promise<Source>;
			})
			.then((freshSource) => {
				setSource(freshSource);
				if (entry.sourceType === "FOOD") {
					const options = quickAddServingOptions(freshSource as FoodDetailDto);
					setServingOptionId(options.find((option) => option.backendServingUnit === entry.servingUnitCode)?.id ?? options[0]?.id ?? "");
				}
			})
			.catch((error) => {
				if (error instanceof DOMException && error.name === "AbortError") return;
				setSourceError(error instanceof Error ? error.message : "منبع ثبت دیگر در دسترس نیست.");
			})
			.finally(() => setLoadingSource(false));
		return () => controller.abort();
	}, [entry.sourceFoodId, entry.sourceMealId, entry.sourceType, entry.servingUnitCode, open]);

	function handleOpenChange(nextOpen: boolean) {
		if (saving) return;
		setOpen(nextOpen);
		if (nextOpen) {
			setMealLabel(diaryMealLabelForType(entry.mealType));
			setAmountInput(String(entry.servingQuantity));
			setIntentId(createEditIntentId());
			setMessage(null);
		}
	}

	async function save() {
		const amount = parseQuickAddAmount(amountInput).value;
		if (amount === null || amount <= 0) return setMessage("مقدار سروینگ باید بیشتر از صفر باشد.");
		if (entry.sourceType !== "MANUAL" && (!source || sourceError || loadingSource)) return setMessage("ابتدا منبع ثبت را تازه‌سازی کنید.");
		if (entry.sourceType === "FOOD" && !selectedOption) return setMessage("واحد سروینگ معتبر نیست.");

		const mealType = quickAddMealTypeByLabel[mealLabel] ?? "SNACK";
		const request = requestFor({ entry, mealType, amount, selectedOption });
		setSaving(true);
		setMessage(null);
		const result = await updateDiaryEntryAction({
			date,
			entryId: entry.id,
			request,
			idempotencyKey: intentId,
			nextPath: `/foods?date=${date}`,
		});
		if (!result.ok) {
			setSaving(false);
			setMessage(result.message);
			toast.error(result.message);
			return;
		}
		setSaving(false);
		setOpen(false);
		toast.success(`ثبت «${entry.displayName}» به‌روزرسانی شد.`);
		startTransition(() => router.refresh());
	}

	const sourceReady = entry.sourceType === "MANUAL" || Boolean(source && !sourceError && !loadingSource);
	return (
		<Sheet open={open} onOpenChange={handleOpenChange}>
			<Button type="button" variant="ghost" size="icon-sm" aria-label={`ویرایش ${entry.displayName}`} disabled={disabled} title={disabled ? "این تاریخ فقط برای مشاهده است." : undefined} onClick={() => handleOpenChange(true)}><PencilIcon /></Button>
      <SheetContent side="bottom" className="mx-auto w-full max-w-xl rounded-t-3xl p-4 sm:p-5" dir="rtl">
				<SheetHeader className="pl-10"><SheetTitle>ویرایش ثبت غذایی</SheetTitle><SheetDescription>تغییرها پس از تأیید سرور در دفتر روزانه نمایش داده می‌شوند.</SheetDescription></SheetHeader>
				<div className="min-h-0 flex-1 overflow-y-auto py-4">
					<FieldGroup className="gap-4">
						<Field><FieldLabel>غذا یا وعده</FieldLabel><p className="rounded-xl border bg-muted/30 px-3 py-2 text-sm">{entry.displayName}</p></Field>
						{loadingSource ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner /> در حال بررسی منبع و گزینه‌های سروینگ</p> : null}
						{sourceError ? <Alert variant="destructive"><AlertTitle>ویرایش ممکن نیست</AlertTitle><AlertDescription>{sourceError}</AlertDescription></Alert> : null}
						<Field><FieldLabel>وعده</FieldLabel><Select value={mealLabel} onValueChange={(value) => { if (value) setMealLabel(value); }}><SelectTrigger className="h-11 rounded-xl"><span>{mealLabel}</span></SelectTrigger><SelectContent><SelectGroup>{diaryMealOptions.map((meal) => <SelectItem key={meal.label} value={meal.label}>{meal.label}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
						<Field><FieldLabel htmlFor={`entry-amount-${entry.id}`}>مقدار</FieldLabel><Input id={`entry-amount-${entry.id}`} type="text" inputMode="decimal" dir="ltr" className="h-11 rounded-xl text-left tabular-nums" value={amountInput} readOnly={entry.sourceType === "MANUAL"} onChange={(event) => setAmountInput(event.currentTarget.value)} /></Field>
						{entry.sourceType === "FOOD" ? <Field><FieldLabel>واحد سروینگ</FieldLabel><Select value={servingOptionId} onValueChange={(value) => { if (value) setServingOptionId(value); }} disabled={!sourceReady}><SelectTrigger className="h-11 rounded-xl"><span>{selectedOption?.label ?? "واحد را انتخاب کنید"}</span></SelectTrigger><SelectContent><SelectGroup>{servingOptions.map((option) => <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>)}</SelectGroup></SelectContent></Select></Field> : null}
						{entry.sourceType === "MANUAL" ? <p className="text-xs leading-5 text-muted-foreground">مقدار و مواد مغذی ثبت دستی ثابت می‌مانند؛ در این مرحله فقط وعده قابل تغییر است.</p> : null}
						{message ? <Alert variant="destructive"><AlertTitle>ویرایش ذخیره نشد</AlertTitle><AlertDescription>{message}</AlertDescription></Alert> : null}
					</FieldGroup>
				</div>
				<SheetFooter><Button type="button" className="h-11 rounded-xl" disabled={!sourceReady || saving} onClick={save}>{saving ? <><Spinner /> در حال ذخیره</> : "ذخیره تغییرها"}</Button></SheetFooter>
			</SheetContent>
		</Sheet>
	);
}

function requestFor({ entry, mealType, amount, selectedOption }: { entry: DiaryEntrySummary; mealType: DiaryMealType; amount: number; selectedOption: ReturnType<typeof quickAddServingOptions>[number] | null }): CreateDiaryEntryRequestDto {
	if (entry.sourceType === "FOOD") return { mealType, sourceType: "FOOD", sourceFoodId: entry.sourceFoodId, sourceMealId: null, servingQuantity: amount * (selectedOption?.backendQuantityPerAmount ?? 1), servingUnit: selectedOption?.backendServingUnit ?? null };
	if (entry.sourceType === "MEAL") return { mealType, sourceType: "MEAL", sourceFoodId: null, sourceMealId: entry.sourceMealId, servingQuantity: amount, servingUnit: null };
	return { mealType, sourceType: "MANUAL", sourceFoodId: null, sourceMealId: null, servingQuantity: entry.servingQuantity, servingUnit: entry.servingUnitCode, displayName: entry.displayName, manualNutrition: entry.nutrition };
}

function createEditIntentId() {
	return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `diary-edit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
