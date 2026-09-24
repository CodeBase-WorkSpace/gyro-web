"use client";

import {ChevronLeftIcon, ChevronRightIcon} from "lucide-react";
import type {KeyboardEvent} from "react";
import {useEffect, useMemo, useRef, useState} from "react";

import {Button} from "@/components/ui/button";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger,} from "@/components/ui/select";
import {shiftDiaryDate} from "@/lib/diary/date";
import {
  buildPersianCalendarMonth,
  formatPersianMonth,
  getPersianDateParts,
  isIsoDiaryDate,
  isoDateForPersianMonth,
  shiftPersianMonth,
} from "@/lib/diary/persian-calendar";
import {toPersianDigits} from "@/lib/format";
import {cn} from "@/lib/utils";

const weekdayLabels = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const persianMonthNames = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

export function PersianCalendarPicker({
	value,
	today,
	onChange,
	ariaLabel = "انتخاب تاریخ",
}: {
	value: string;
	today?: string;
	onChange: (isoDate: string) => void;
	ariaLabel?: string;
}) {
	const [visibleMonth, setVisibleMonth] = useState(value);
	const selectedButtonRef = useRef<HTMLButtonElement>(null);
	const days = useMemo(() => buildPersianCalendarMonth(visibleMonth), [visibleMonth]);
  const visibleParts = useMemo(() => getPersianDateParts(visibleMonth), [visibleMonth]);
  const yearOptions = useMemo(
    () =>
      Array.from(
        {length: 121},
        (_, index) => visibleParts.year - 80 + index,
      ),
    [visibleParts.year],
  );
	const selectedIsVisible = days.some((day) => day.isoDate === value);

	useEffect(() => {
		if (isIsoDiaryDate(value)) setVisibleMonth(value);
	}, [value]);

	function selectDate(isoDate: string, focus = false) {
		onChange(isoDate);
		setVisibleMonth(isoDate);
		if (focus) requestAnimationFrame(() => selectedButtonRef.current?.focus());
	}

  function changeVisibleMonth(year: number, month: number) {
    setVisibleMonth(isoDateForPersianMonth(year, month));
  }

	function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, isoDate: string) {
		let nextDate: string | undefined;
		switch (event.key) {
			case "ArrowRight": nextDate = shiftDiaryDate(isoDate, -1); break;
			case "ArrowLeft": nextDate = shiftDiaryDate(isoDate, 1); break;
			case "ArrowUp": nextDate = shiftDiaryDate(isoDate, -7); break;
			case "ArrowDown": nextDate = shiftDiaryDate(isoDate, 7); break;
			case "Home": nextDate = shiftDiaryDate(isoDate, -((new Date(`${isoDate}T12:00:00Z`).getUTCDay() + 1) % 7)); break;
			case "End": nextDate = shiftDiaryDate(isoDate, 6 - ((new Date(`${isoDate}T12:00:00Z`).getUTCDay() + 1) % 7)); break;
			case "PageUp": nextDate = shiftPersianMonth(isoDate, -1); break;
			case "PageDown": nextDate = shiftPersianMonth(isoDate, 1); break;
			default: return;
		}
		event.preventDefault();
		selectDate(nextDate, true);
	}

	return (
		<div className="rounded-2xl border bg-card p-3" role="group" aria-label={ariaLabel}>
      <div className="mb-3 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
				<Button type="button" variant="ghost" size="icon" aria-label="ماه بعد" onClick={() => setVisibleMonth((month) => shiftPersianMonth(month, 1))}>
					<ChevronRightIcon />
				</Button>
        <div className="grid min-w-0 grid-cols-2 gap-2">
          <Select
            value={String(visibleParts.month)}
            onValueChange={(month) => {
              if (month) changeVisibleMonth(visibleParts.year, Number(month));
            }}
          >
            <SelectTrigger
              aria-label="انتخاب ماه"
              className="h-9 w-full rounded-xl text-xs"
            >
              <span>{persianMonthNames[visibleParts.month - 1]}</span>
            </SelectTrigger>
            <SelectContent align="center">
              <SelectGroup>
                {persianMonthNames.map((month, index) => (
                  <SelectItem key={month} value={String(index + 1)}>
                    {month}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select
            value={String(visibleParts.year)}
            onValueChange={(year) => {
              if (year) changeVisibleMonth(Number(year), visibleParts.month);
            }}
          >
            <SelectTrigger
              aria-label="انتخاب سال"
              className="h-9 w-full rounded-xl text-xs"
            >
              <span>{toPersianDigits(visibleParts.year)}</span>
            </SelectTrigger>
            <SelectContent align="center" className="max-h-72">
              <SelectGroup>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {toPersianDigits(year)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
				<Button type="button" variant="ghost" size="icon" aria-label="ماه قبل" onClick={() => setVisibleMonth((month) => shiftPersianMonth(month, -1))}>
					<ChevronLeftIcon />
				</Button>
			</div>
			<div className="grid grid-cols-7 gap-1 text-center" role="grid" aria-label={formatPersianMonth(visibleMonth)}>
				{weekdayLabels.map((label) => <span key={label} className="py-1 text-xs font-bold text-muted-foreground" aria-hidden="true">{label}</span>)}
				{days.map((day) => {
					const selected = day.isoDate === value;
					const isToday = day.isoDate === today;
					const fallbackTabStop = !selectedIsVisible && day.inCurrentMonth && day.day === 1;
					return (
						<button
							key={day.isoDate}
							ref={selected ? selectedButtonRef : undefined}
							type="button"
							role="gridcell"
							aria-selected={selected}
							aria-label={`${isToday ? "امروز، " : ""}${toPersianDigits(day.day)} ${formatPersianMonth(day.isoDate)}`}
							aria-current={isToday ? "date" : undefined}
							tabIndex={selected || fallbackTabStop ? 0 : -1}
							className={cn(
								"aspect-square rounded-xl text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
								day.inCurrentMonth ? "text-foreground hover:bg-muted" : "text-muted-foreground/45 hover:bg-muted/50",
								selected && "bg-primary text-primary-foreground hover:bg-primary/90",
								isToday && !selected && "ring-1 ring-primary/70 ring-inset",
							)}
							onClick={() => selectDate(day.isoDate)}
							onKeyDown={(event) => handleKeyDown(event, day.isoDate)}
						>
							{toPersianDigits(day.day)}
						</button>
					);
				})}
			</div>
		</div>
	);
}
