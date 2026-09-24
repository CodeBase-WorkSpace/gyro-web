"use client";

import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger} from "@/components/ui/select";
import {cn} from "@/lib/utils";

export type FormSelectOption = { value: string; label: string; description?: string };

export function FormSelect({
                             id,
                             value,
                             options,
                             disabled,
                             invalid,
                             ariaLabel,
                             placeholder = "انتخاب کنید",
                             className,
                             onValueChange
                           }: {
  id?: string;
  value: string;
  options: readonly FormSelectOption[];
  disabled?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
  onValueChange: (value: string) => void;
}) {
  const selected = options.find((option) => option.value === value);
  return <Select value={value} disabled={disabled} onValueChange={(next) => {
    if (next) onValueChange(next);
  }}>
    <SelectTrigger id={id} aria-label={ariaLabel} aria-invalid={invalid}
                   className={cn("h-11 w-full rounded-xl", className)}>
      <span className="truncate">{selected?.label ?? placeholder}</span>
    </SelectTrigger>
    <SelectContent align="end">
      <SelectGroup>
        {options.map((option) => <SelectItem key={option.value} value={option.value}>
          <span>{option.label}</span>
          {option.description ? <span className="text-muted-foreground">{option.description}</span> : null}
        </SelectItem>)}
      </SelectGroup>
    </SelectContent>
  </Select>;
}
