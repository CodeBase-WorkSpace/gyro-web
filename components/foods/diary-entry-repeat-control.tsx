"use client";

import {CopyPlusIcon} from "lucide-react";
import {startTransition, useState} from "react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";

import {repeatDiaryEntryAction} from "@/app/_actions/quick-add";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {PersianCalendarPicker} from "@/components/ui/persian-calendar-picker";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {Spinner} from "@/components/ui/spinner";
import type {DiaryEntrySummary} from "@/lib/api/diary";
import {formatPersianDayLabel} from "@/lib/format";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function DiaryEntryRepeatControl({
	date,
	entry,
	disabled = false,
}: {
	date: string;
	entry: DiaryEntrySummary;
	disabled?: boolean;
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [targetDate, setTargetDate] = useState(date);
	const [intentId, setIntentId] = useState(() => createRepeatIntentId());
	const [repeating, setRepeating] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	function handleOpenChange(nextOpen: boolean) {
		if (repeating) return;
		setOpen(nextOpen);
		if (nextOpen) {
			setTargetDate(date);
			setIntentId(createRepeatIntentId());
			setMessage(null);
		}
	}

	async function repeat() {
		if (!isIsoDate(targetDate)) return setMessage("تاریخ هدف معتبر نیست.");
		setRepeating(true);
		setMessage(null);
		const result = await repeatDiaryEntryAction({
			targetDate,
			entryId: entry.id,
			idempotencyKey: intentId,
			nextPath: `/foods?date=${targetDate}`,
		});
		if (!result.ok) {
			setRepeating(false);
			setMessage(result.message);
			toast.error(result.message);
			return;
		}
		setRepeating(false);
		setOpen(false);
		toast.success(`«${entry.displayName}» در تاریخ هدف تکرار شد.`);
		if (targetDate !== date) {
			startTransition(() => router.push(`/foods?date=${targetDate}`));
			return;
		}
		startTransition(() => router.refresh());
	}

	return (
		<Sheet open={open} onOpenChange={handleOpenChange}>
			<Button type="button" variant="ghost" size="icon-sm" aria-label={`تکرار ${entry.displayName}`} disabled={disabled} title={disabled ? "این تاریخ فقط برای مشاهده است." : undefined} onClick={() => handleOpenChange(true)}>
				<CopyPlusIcon />
			</Button>
      <SheetContent side="bottom" className="mx-auto w-full max-w-xl rounded-t-3xl p-4 sm:p-5" dir="rtl">
				<SheetHeader className="pl-10">
					<SheetTitle>تکرار ثبت غذایی</SheetTitle>
					<SheetDescription>«{entry.displayName}» با همان مقدار و مواد مغذی ثبت‌شده تکرار می‌شود.</SheetDescription>
				</SheetHeader>
				<ScrollArea className="min-h-0 flex-1" viewportClassName="flex min-h-full flex-col gap-4 py-4 pe-1">
					<div className="grid gap-2">
						<strong className="text-sm">تاریخ هدف</strong>
						<PersianCalendarPicker
							value={targetDate}
							onChange={(nextDate) => {
								setTargetDate(nextDate);
								setIntentId(createRepeatIntentId());
								setMessage(null);
							}}
							ariaLabel="انتخاب تاریخ هدف برای تکرار ثبت"
						/>
					</div>
					<p className="rounded-xl border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
						{targetDateLabel(targetDate)}
					</p>
					{message ? <Alert variant="destructive"><AlertTitle>تکرار انجام نشد</AlertTitle><AlertDescription>{message}</AlertDescription></Alert> : null}
				</ScrollArea>
				<SheetFooter>
					<Button type="button" className="h-11 rounded-xl" disabled={repeating} onClick={repeat}>
						{repeating ? <><Spinner /> در حال تکرار</> : "تکرار در تاریخ هدف"}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}

function isIsoDate(value: string) {
	if (!ISO_DATE.test(value)) return false;
	const date = new Date(`${value}T12:00:00Z`);
	return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function targetDateLabel(value: string) {
	if (!isIsoDate(value)) return "یک تاریخ معتبر انتخاب کنید.";
	return `ثبت در ${formatPersianDayLabel(new Date(`${value}T12:00:00Z`))}`;
}

function createRepeatIntentId() {
	return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `diary-repeat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
