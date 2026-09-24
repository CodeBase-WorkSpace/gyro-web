"use client";

import {CalendarDaysIcon} from "lucide-react";
import {useState} from "react";

import {Button} from "@/components/ui/button";
import {PersianCalendarPicker} from "@/components/ui/persian-calendar-picker";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {formatPersianDayLabel} from "@/lib/format";

export function DropdownDatePicker({
                                     value,
                                     today,
                                     ariaLabel,
                                     invalid = false,
                                     placeholder = "انتخاب تاریخ",
                                     onChange,
                                   }: {
  value: string;
  today: string;
  ariaLabel: string;
  invalid?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const pickerValue = value || today;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="xl"
            className="h-11 w-full min-w-0 justify-between rounded-xl bg-background/45 px-3 text-right font-semibold"
            aria-expanded={open}
            aria-invalid={invalid}
            aria-label={ariaLabel}
          />
        }
      >
        <CalendarDaysIcon className="shrink-0 text-muted-foreground" aria-hidden/>
        <DateLabel value={value} placeholder={placeholder}/>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[min(calc(100vw-2rem),22rem)] rounded-2xl border bg-popover p-0"
        dir="rtl"
      >
        <PersianCalendarPicker
          value={pickerValue}
          today={today}
          ariaLabel={ariaLabel}
          onChange={(nextValue) => {
            onChange(nextValue);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function DateLabel({
                     value,
                     placeholder,
                   }: {
  value: string;
  placeholder: string;
}) {
  if (!value) {
    return (
      <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground sm:text-sm">
        {placeholder}
      </span>
    );
  }

  return (
    <span className="flex min-w-0 flex-1 flex-col items-end leading-tight">
      <span className="max-w-full truncate text-[0.72rem] text-foreground sm:text-xs">
        {formatPersianDayLabel(new Date(`${value}T12:00:00Z`))}
      </span>
      <span className="max-w-full truncate text-[0.65rem] text-muted-foreground sm:text-[0.7rem]">
        {value}
      </span>
    </span>
  );
}
