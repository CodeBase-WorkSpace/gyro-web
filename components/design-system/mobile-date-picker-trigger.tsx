"use client";

import { CalendarDaysIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PersianCalendarPicker } from "@/components/ui/persian-calendar-picker";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function MobileDatePickerTrigger({
	dateLabel,
	value,
	today,
	path,
	variant,
	className,
}: {
	dateLabel: string;
	value: string;
	today: string;
	path: string;
	variant: "icon" | "label";
	className?: string;
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);

	function chooseDate(nextDate: string) {
		setOpen(false);
		router.push(`${path}?date=${encodeURIComponent(nextDate)}`);
	}

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			{variant === "icon" ? (
				<Button
					type="button"
					variant="outline"
					size="icon-lg"
					className={className}
					aria-label="انتخاب تاریخ"
					onClick={() => setOpen(true)}
				>
					<CalendarDaysIcon />
				</Button>
			) : (
				<Button
					type="button"
					variant="ghost"
					className={cn(
						"h-auto max-w-full px-2 py-1 text-sm font-bold",
						className,
					)}
					aria-label={`انتخاب تاریخ؛ ${dateLabel}`}
					onClick={() => setOpen(true)}
				>
					<span className="truncate" dir="rtl">
						{dateLabel}
					</span>
				</Button>
			)}
			<SheetContent
				side="bottom"
				className="mx-auto max-w-xl rounded-t-3xl p-4 sm:p-5"
				dir="rtl"
			>
				<SheetHeader>
					<SheetTitle>انتخاب تاریخ</SheetTitle>
					<SheetDescription>
						روز موردنظر را از تقویم انتخاب کنید.
					</SheetDescription>
				</SheetHeader>
				<div className="pt-4">
					<PersianCalendarPicker
						value={value}
						today={today}
						onChange={chooseDate}
						ariaLabel="انتخاب تاریخ دفتر غذایی"
					/>
				</div>
			</SheetContent>
		</Sheet>
	);
}
