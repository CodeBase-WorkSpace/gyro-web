"use client";

import {Trash2Icon} from "lucide-react";

import {ServingWeightField} from "@/components/foods/serving-weight-field";
import {Button} from "@/components/ui/button";
import {Field, FieldLabel} from "@/components/ui/field";
import {Input} from "@/components/ui/input";

export function CustomServingField({
                                     idPrefix,
                                     name,
                                     weight,
                                     index,
                                     disabled,
                                     editableName = true,
                                     removable = true,
                                     preview,
                                     onNameChange,
                                     onWeightChange,
                                     onRemove
                                   }: {
  idPrefix: string;
  name: string;
  weight: string;
  index?: number;
  disabled?: boolean;
  editableName?: boolean;
  removable?: boolean;
  preview?: string | null;
  onNameChange?: (value: string) => void;
  onWeightChange: (value: string) => void;
  onRemove?: () => void;
}) {
  return <div className="rounded-2xl border bg-background p-3">
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:items-end">
      {editableName ? <Field>
        <FieldLabel htmlFor={`${idPrefix}-name`}>نام
          سروینگ{typeof index === "number" ? ` ${index + 1}` : ""}</FieldLabel>
        <Input id={`${idPrefix}-name`} value={name} disabled={disabled} placeholder="مثلاً یک تکه" autoComplete="off"
               className="h-11 rounded-2xl" onChange={(event) => onNameChange?.(event.currentTarget.value)}/>
      </Field> : <div className="rounded-2xl border bg-muted/30 px-3 py-2.5 text-sm font-bold">{name}</div>}
      <ServingWeightField id={`${idPrefix}-weight`} label="وزن (گرم)" value={weight} disabled={disabled}
                          placeholder="10" onChange={onWeightChange}/>
      {removable ? <Button type="button" variant="ghost" size="icon-lg"
                           className="rounded-full text-destructive hover:text-destructive" disabled={disabled}
                           aria-label="حذف سروینگ" onClick={onRemove}>
        <Trash2Icon/>
      </Button> : <span aria-hidden="true"/>}
    </div>
    {preview ? <p className="mt-2 text-xs text-muted-foreground">{preview}</p> : null}
  </div>;
}
