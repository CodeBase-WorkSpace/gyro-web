"use client";

import {Field, FieldLabel} from "@/components/ui/field";
import {Input} from "@/components/ui/input";

export function ServingWeightField({
                                     id,
                                     label,
                                     value,
                                     disabled,
                                     invalid,
                                     placeholder,
                                     onChange,
                                   }: {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  invalid?: boolean;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        value={value}
        disabled={disabled}
        inputMode="decimal"
        dir="ltr"
        placeholder={placeholder}
        className="h-11 rounded-2xl bg-background text-left tabular-nums"
        aria-invalid={invalid}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </Field>
  );
}
