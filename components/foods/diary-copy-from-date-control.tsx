"use client";

import { ArrowDownToLineIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { copyDiaryDayAction } from "@/app/_actions/quick-add";
import { PersianCalendarPicker } from "@/components/ui/persian-calendar-picker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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

type CopyButtonProps = ComponentProps<typeof Button>;

export function DiaryCopyFromDateControl({
	targetDate,
	disabled = false,
	buttonClassName,
	labelClassName,
	label = "کپی از تاریخ دیگر → این روز",
	size = "sm",
	variant = "outline",
}: {
	targetDate: string;
	disabled?: boolean;
	buttonClassName?: string;
	labelClassName?: string;
	label?: string;
	size?: CopyButtonProps["size"];
	variant?: CopyButtonProps["variant"];
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [sourceDate, setSourceDate] = useState(() =>
		shiftDiaryDate(targetDate, -1),
	);
	const [intentId, setIntentId] = useState(() => createCopyIntentId());
	const [copying, setCopying] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	function handleOpenChange(nextOpen: boolean) {
		if (copying) return;
		setOpen(nextOpen);
		if (nextOpen) {
			setSourceDate(shiftDiaryDate(targetDate, -1));
			setIntentId(createCopyIntentId());
			setMessage(null);
		}
	}

	function chooseSourceDate(nextDate: string) {
		setSourceDate(nextDate);
		setIntentId(createCopyIntentId());
		setMessage(null);
	}

	async function copyDay() {
		if (sourceDate === targetDate) {
			setMessage("تاریخ مبدأ باید با تاریخ مقصد متفاوت باشد.");
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
		if (!result.ok) {
			setCopying(false);
			setMessage(result.message);
			toast.error(result.message);
			return;
		}
		setCopying(false);
		setOpen(false);
		toast.success("ثبت‌های دفتر غذایی از تاریخ مبدأ کپی شدند.");
		startTransition(() => router.refresh());
	}

	return (
		<Sheet open={open} onOpenChange={handleOpenChange}>
			<Button
				type="button"
				variant={variant}
				size={size}
				className={buttonClassName}
				aria-label={label}
				disabled={disabled}
				title={disabled ? "این تاریخ فقط برای مشاهده است." : undefined}
				onClick={() => handleOpenChange(true)}
			>
				<ArrowDownToLineIcon />
				<span className={labelClassName ?? "hidden sm:inline"}>
					{label}
				</span>
			</Button>
			<SheetContent
				side="bottom"
				className="mx-auto w-full max-w-xl rounded-t-3xl p-4 sm:p-5"
				dir="rtl"
			>
				<SheetHeader className="pl-10">
					<SheetTitle>کپی از تاریخ دیگر به این روز</SheetTitle>
					<SheetDescription>
						ثبت‌های تاریخ مبدأ به همین روز اضافه می‌شوند و مسیر کپی
						فقط به سمت تاریخ مقصد است.
					</SheetDescription>
				</SheetHeader>
				<ScrollArea
					className="min-h-0 flex-1"
					viewportClassName="flex min-h-full flex-col gap-4 py-4 pe-1"
				>
					<div className="grid gap-3 rounded-2xl border bg-primary/10 p-3 text-sm">
						<span className="text-xs font-bold text-muted-foreground">
							مسیر کپی
						</span>
						<div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
							<div className="rounded-xl border bg-background/70 p-3">
								<span className="block text-muted-foreground">
									از تاریخ
								</span>
								<strong>{formatDate(sourceDate)}</strong>
							</div>
							<ArrowDownToLineIcon
								className="mx-auto text-primary"
								aria-hidden="true"
							/>
							<div className="rounded-xl border border-primary/35 bg-primary/10 p-3">
								<span className="block text-muted-foreground">
									به این روز
								</span>
								<strong>{formatDate(targetDate)}</strong>
							</div>
						</div>
					</div>
					<div className="grid gap-2">
						<strong className="text-sm">تاریخ مبدأ</strong>
						<PersianCalendarPicker
							value={sourceDate}
							onChange={chooseSourceDate}
							ariaLabel="انتخاب تاریخ مبدأ برای کپی"
						/>
						<p className="text-sm text-muted-foreground">
							انتخاب‌شده: {formatDate(sourceDate)}
						</p>
					</div>
					{sourceDate === targetDate ? (
						<Alert variant="destructive">
							<AlertTitle>تاریخ یکسان است</AlertTitle>
							<AlertDescription>
								تاریخ مبدأ باید با تاریخ مقصد متفاوت باشد.
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
						disabled={copying || sourceDate === targetDate}
						onClick={copyDay}
					>
						{copying ? (
							<>
								<Spinner /> در حال کپی
							</>
						) : (
							"کپی از مبدأ به این روز"
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
