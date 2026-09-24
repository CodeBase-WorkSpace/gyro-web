"use client";

import {startTransition, useActionState, useEffect, useRef, useState,} from "react";
import {useFormStatus} from "react-dom";
import {SaveIcon, ScaleIcon} from "lucide-react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";

import {
  saveWeightEntryAction,
  type WeightEntryFormState,
  type WeightEntryFormValues,
} from "@/app/_actions/weight-entries";
import {DropdownDatePicker} from "@/components/progress/dropdown-date-picker";
import {Button} from "@/components/ui/button";
import {Field, FieldDescription, FieldError, FieldGroup, FieldLabel,} from "@/components/ui/field";
import {Input} from "@/components/ui/input";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {Spinner} from "@/components/ui/spinner";
import type {WeightUnit} from "@/lib/api/weight";
import {isIsoDiaryDate} from "@/lib/diary/persian-calendar";
import {cn} from "@/lib/utils";

type WeightEntrySheetProps = {
  defaultDate: string;
  nextPath?: string;
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved?: () => void;
};

const unitLabels: Record<WeightUnit, string> = {
  KG: "کیلوگرم",
  LB: "پوند",
};

export function WeightEntrySheet({
                                   defaultDate,
                                   nextPath = "/progress/weight",
                                   trigger,
                                   open,
                                   onOpenChange,
                                   onSaved,
                                 }: WeightEntrySheetProps) {
  const router = useRouter();
  const [state, formAction] = useActionState<WeightEntryFormState, FormData>(
    saveWeightEntryAction,
    {
      formValues: initialFormValues(defaultDate, nextPath),
    },
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<WeightUnit>(
    state.formValues?.unit ?? "KG",
  );
  const [selectedDate, setSelectedDate] = useState(
    state.formValues?.recordedDate ?? defaultDate,
  );
  const saveToastId = useRef<string | number | undefined>(undefined);
  const controlled = open !== undefined;
  const currentOpen = controlled ? open : sheetOpen;
  const sheetSide = useResponsiveSheetSide();
  const values = state.formValues ?? initialFormValues(defaultDate, nextPath);

  useEffect(() => {
    if (state.formValues?.unit) setSelectedUnit(state.formValues.unit);
  }, [state.formValues?.unit]);

  useEffect(() => {
    if (state.formValues?.recordedDate) {
      setSelectedDate(state.formValues.recordedDate);
    }
  }, [state.formValues?.recordedDate]);

  useEffect(() => {
    setSelectedDate(defaultDate);
  }, [defaultDate]);

  useEffect(() => {
    if (!state.message) return;

    if (state.ok) {
      toast.success(state.message, {id: saveToastId.current});
      saveToastId.current = undefined;
      if (controlled) onOpenChange?.(false);
      else setSheetOpen(false);
      onSaved?.();
      startTransition(() => router.refresh());
      return;
    }

    toast.error(state.message, {id: saveToastId.current});
    saveToastId.current = undefined;
  }, [controlled, onOpenChange, onSaved, router, state]);

  function handleOpenChange(nextOpen: boolean) {
    if (controlled) onOpenChange?.(nextOpen);
    else setSheetOpen(nextOpen);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      event.preventDefault();
      toast.error("اتصال اینترنت قطع است. وزن ثبت نشد.");
      return;
    }

    saveToastId.current = toast.loading("در حال ثبت وزن...");
  }

  return (
    <Sheet open={currentOpen} onOpenChange={handleOpenChange}>
      {trigger ? <SheetTrigger render={trigger}/> : null}
      <SheetContent
        side={sheetSide}
        className="p-4 sm:p-5"
        dir="rtl"
      >
        <SheetHeader className="pl-10">
          <SheetTitle className="flex items-center gap-2">
            <ScaleIcon data-icon="inline-start"/>
            ثبت وزن
          </SheetTitle>
          <SheetDescription>
            وزن امروز یا یک روز قبلی را ثبت کنید. هر روز فقط یک
            اندازه‌گیری فعال دارد و ثبت دوباره همان روز آن را جایگزین
            می‌کند.
          </SheetDescription>
        </SheetHeader>

        <form
          action={formAction}
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={handleSubmit}
        >
          <input type="hidden" name="nextPath" value={nextPath}/>
          <input type="hidden" name="unit" value={selectedUnit}/>
          <input
            type="hidden"
            name="recordedDate"
            value={selectedDate}
          />
          <ScrollArea
            className="min-h-0 flex-1"
            viewportClassName="flex min-h-full flex-col gap-4 pb-2"
          >
            <FieldGroup>
              <Field
                data-invalid={Boolean(
                  state.fieldErrors?.recordedDate,
                )}
              >
                <FieldLabel>تاریخ ثبت</FieldLabel>
                <WeightDatePicker
                  value={selectedDate}
                  today={defaultDate}
                  invalid={Boolean(
                    state.fieldErrors?.recordedDate,
                  )}
                  onChange={setSelectedDate}
                />
                <FieldError>
                  {state.fieldErrors?.recordedDate}
                </FieldError>
              </Field>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
                <Field
                  data-invalid={Boolean(
                    state.fieldErrors?.weight,
                  )}
                >
                  <FieldLabel htmlFor="weight-value">
                    وزن
                  </FieldLabel>
                  <Input
                    id="weight-value"
                    name="weight"
                    inputMode="decimal"
                    placeholder={
                      selectedUnit === "KG"
                        ? "مثلاً ۷۸٫۴"
                        : "مثلاً ۱۷۲٫۸"
                    }
                    defaultValue={values.weight}
                    aria-invalid={Boolean(
                      state.fieldErrors?.weight,
                    )}
                    required
                  />
                  <FieldError>
                    {state.fieldErrors?.weight}
                  </FieldError>
                </Field>

                <Field
                  data-invalid={Boolean(state.fieldErrors?.unit)}
                >
                  <FieldLabel>واحد</FieldLabel>
                  <Select
                    value={selectedUnit}
                    onValueChange={(value) =>
                      setSelectedUnit(value as WeightUnit)
                    }
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-invalid={Boolean(
                        state.fieldErrors?.unit,
                      )}
                    >
                      <SelectValue>
                        {unitLabels[selectedUnit]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="KG">
                          کیلوگرم
                        </SelectItem>
                        <SelectItem value="LB">
                          پوند
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError>
                    {state.fieldErrors?.unit}
                  </FieldError>
                </Field>
              </div>

              <Field
                data-invalid={Boolean(state.fieldErrors?.notes)}
              >
                <FieldLabel htmlFor="weight-notes">
                  یادداشت
                </FieldLabel>
                <Input
                  id="weight-notes"
                  name="notes"
                  defaultValue={values.notes}
                  placeholder="اختیاری، مثل صبح ناشتا"
                  aria-invalid={Boolean(
                    state.fieldErrors?.notes,
                  )}
                />
                <FieldDescription>
                  یادداشت فقط برای خودتان نمایش داده می‌شود.
                </FieldDescription>
                <FieldError>
                  {state.fieldErrors?.notes}
                </FieldError>
              </Field>
            </FieldGroup>

            {state.message && !state.ok ? (
              <p
                className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm leading-7 text-destructive"
                role="alert"
              >
                {state.message}
                {state.requestId ? (
                  <span className="block text-xs opacity-80">
										شناسه درخواست: {state.requestId}
									</span>
                ) : null}
              </p>
            ) : null}
          </ScrollArea>
          <SheetFooter className="border-t pt-3">
            <div className="grid grid-cols-[auto_1fr] gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                لغو
              </Button>
              <WeightEntrySubmitButton/>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function WeightEntryTriggerButton({
                                           className,
                                           labelClassName,
                                           variant = "outline",
                                           size = "lg",
                                         }: {
  className?: string;
  labelClassName?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
}) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn("rounded-full", className)}
      aria-label="ثبت وزن"
    >
      <ScaleIcon data-icon="inline-start"/>
      <span className={labelClassName}>ثبت وزن</span>
    </Button>
  );
}

function WeightEntrySubmitButton() {
  const {pending} = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      className="h-12 rounded-full text-sm font-bold"
      disabled={pending}
    >
      {pending ? (
        <Spinner data-icon="inline-start"/>
      ) : (
        <SaveIcon data-icon="inline-start"/>
      )}
      {pending ? "در حال ذخیره" : "ذخیره وزن"}
    </Button>
  );
}

function WeightDatePicker({
                            value,
                            today,
                            invalid,
                            onChange,
                          }: {
  value: string;
  today: string;
  invalid: boolean;
  onChange: (date: string) => void;
}) {
  const pickerValue = isIsoDiaryDate(value) ? value : today;

  return (
    <DropdownDatePicker
      value={pickerValue}
      today={today}
      invalid={invalid}
      ariaLabel="انتخاب تاریخ ثبت وزن"
      onChange={onChange}
    />
  );
}

function useResponsiveSheetSide() {
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updateViewport = () => setIsDesktopViewport(mediaQuery.matches);
    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);

    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  return isDesktopViewport ? "left" : "bottom";
}

function initialFormValues(
  defaultDate: string,
  nextPath: string,
): WeightEntryFormValues {
  return {
    recordedDate: defaultDate,
    weight: "",
    unit: "KG",
    notes: "",
    nextPath,
  };
}
