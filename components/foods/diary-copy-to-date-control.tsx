"use client";

import { ArrowUpFromLineIcon } from "lucide-react";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { copyDiaryDayAction } from "@/app/_actions/quick-add";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PersianCalendarPicker } from "@/components/ui/persian-calendar-picker";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { shiftDiaryDate } from "@/lib/diary/date";
import { formatPersianDayLabel } from "@/lib/format";

export function DiaryCopyToDateControl({
	sourceDate,
	disabled = false,
}: {
	sourceDate: string;
	disabled?: boolean;
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [targetDate, setTargetDate] = useState(() =>
		shiftDiaryDate(sourceDate, 1),
	);
	const [intentId, setIntentId] = useState(() => createCopyIntentId());
	const [copying, setCopying] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	function handleOpenChange(nextOpen: boolean) {
		if (copying) return;
		setOpen(nextOpen);
		if (nextOpen) {
			setTargetDate(shiftDiaryDate(sourceDate, 1));
			setIntentId(createCopyIntentId());
			setMessage(null);
		}
	}

	function chooseTargetDate(nextDate: string) {
		setTargetDate(nextDate);
		setIntentId(createCopyIntentId());
		setMessage(null);
	}

	async function copyDay() {
		if (targetDate === sourceDate) {
			setMessage("تاریخ مقصد باید با تاریخ امروز متفاوت باشد.");
			return;
		}

		setCopying(true);
		setMessage(null);
		const result = await copyDiaryDayAction({
			targetDate,
			sourceDate,
			idempotencyKey: intentId,
			nextPath: `/foods?date=${targetDate}`,
		});
		setCopying(false);

		if (!result.ok) {
			setMessage(result.message);
			toast.error(result.message);
			return;
		}

		setOpen(false);
		toast.success("ثبت‌های این روز به تاریخ مقصد اضافه شدند.");
		startTransition(() => router.push(`/foods?date=${targetDate}`));
	}

	return (
		<Sheet open={open} onOpenChange={handleOpenChange}>
			<Button
				type="button"
				variant="outline"
				size="lg"
				disabled={disabled}
				onClick={() => handleOpenChange(true)}
				aria-label="کپی این روز به تاریخ دیگر"
				title={disabled ? "این تاریخ فقط برای مشاهده است." : undefined}
				className="max-sm:size-10 max-sm:px-0"
			>
				<ArrowUpFromLineIcon />
				<span className="max-sm:sr-only">
					کپی این روز به تاریخ دیگر
				</span>
			</Button>
			<SheetContent
				side="bottom"
				className="mx-auto max-w-xl rounded-t-3xl p-4 sm:p-5"
				dir="rtl"
			>
				<SheetHeader className="pl-10">
					<SheetTitle>کپی این روز به تاریخ دیگر</SheetTitle>
					<SheetDescription>
						ثبت‌های این روز به تاریخ مقصد اضافه می‌شوند و ثبت‌های
						موجود مقصد حذف نمی‌شوند.
					</SheetDescription>
				</SheetHeader>
				<ScrollArea
					className="min-h-0 flex-1"
					viewportClassName="flex min-h-full flex-col gap-4 py-4 pe-1"
				>
					<div className="grid gap-3 rounded-2xl border bg-secondary/55 p-3 text-sm">
						<span className="text-xs font-bold text-muted-foreground">
							مسیر کپی
						</span>
						<div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
							<div className="rounded-xl border border-primary/35 bg-primary/10 p-3">
								<span className="block text-muted-foreground">
									این روز
								</span>
								<strong>{formatDate(sourceDate)}</strong>
							</div>
							<ArrowUpFromLineIcon
								className="mx-auto text-primary"
								aria-hidden="true"
							/>
							<div className="rounded-xl border bg-background/70 p-3">
								<span className="block text-muted-foreground">
									به تاریخ
								</span>
								<strong>{formatDate(targetDate)}</strong>
							</div>
						</div>
					</div>
					<div className="grid gap-2">
						<strong className="text-sm">تاریخ مقصد</strong>
						<PersianCalendarPicker
							value={targetDate}
							onChange={chooseTargetDate}
							ariaLabel="انتخاب تاریخ مقصد برای کپی"
						/>
						<p className="text-sm text-muted-foreground">
							انتخاب‌شده: {formatDate(targetDate)}
						</p>
					</div>
					{targetDate === sourceDate ? (
						<Alert variant="destructive">
							<AlertTitle>تاریخ یکسان است</AlertTitle>
							<AlertDescription>
								تاریخ مقصد باید با تاریخ مبدأ متفاوت باشد.
							</AlertDescription>
						</Alert>
					) : null}
					{message ? (
						<Alert variant="destructive">
							<AlertTitle>کپی انجام نشد</AlertTitle>
							<AlertDescription>{message}</AlertDescription>
						</Alert>
					) : null}
				</ScrollArea>
				<SheetFooter>
					<Button
						type="button"
						className="h-11 rounded-xl"
						disabled={copying || targetDate === sourceDate}
						onClick={copyDay}
					>
						{copying ? (
							<>
								<Spinner /> در حال کپی
							</>
						) : (
							"کپی این روز به مقصد"
						)}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}

function formatDate(isoDate: string) {
	return formatPersianDayLabel(new Date(`${isoDate}T12:00:00Z`));
}

function createCopyIntentId() {
	return typeof crypto !== "undefined" && "randomUUID" in crypto
		? crypto.randomUUID()
		: `diary-copy-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
