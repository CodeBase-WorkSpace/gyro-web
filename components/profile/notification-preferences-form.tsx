"use client";

import {useActionState, useState, type ReactNode} from "react";
import {useFormStatus} from "react-dom";
import {BellIcon, BellRingIcon, SaveIcon, ScaleIcon} from "lucide-react";

import type {NotificationPreferencesActionState} from "@/app/(app)/profile/notifications/actions";
import {Button} from "@/components/ui/button";
import {Field, FieldError, FieldLabel} from "@/components/ui/field";
import {Input} from "@/components/ui/input";
import {Spinner} from "@/components/ui/spinner";

type Props = {
  action: (previous: NotificationPreferencesActionState, formData: FormData) => Promise<NotificationPreferencesActionState>;
  quietHoursStart: string;
  quietHoursEnd: string;
  optionalBillingEnabled: boolean;
  optionalAnnouncementsEnabled: boolean;
  foodReminderEnabled: boolean;
  foodReminderTime: string;
  weightReminderEnabled: boolean;
  weightReminderTime: string;
};

const initialState: NotificationPreferencesActionState = {};

export function NotificationPreferencesForm(props: Props) {
  const [state, formAction] = useActionState(props.action, initialState);
  const saved = state.savedSettings ?? props;
  const savedFoodTime = saved.foodReminderTime.slice(0, 5);
  const savedWeightTime = saved.weightReminderTime.slice(0, 5);
  const [optionalBilling, setOptionalBilling] = useState(saved.optionalBillingEnabled);
  const [optionalAnnouncements, setOptionalAnnouncements] = useState(saved.optionalAnnouncementsEnabled);
  const [foodReminder, setFoodReminder] = useState(saved.foodReminderEnabled);
  const [foodTime, setFoodTime] = useState(savedFoodTime);
  const [weightReminder, setWeightReminder] = useState(saved.weightReminderEnabled);
  const [weightTime, setWeightTime] = useState(savedWeightTime);
  const [quietStart, setQuietStart] = useState(saved.quietHoursStart.slice(0, 5));
  const [quietEnd, setQuietEnd] = useState(saved.quietHoursEnd.slice(0, 5));
  const hasChanges = optionalBilling !== saved.optionalBillingEnabled
    || optionalAnnouncements !== saved.optionalAnnouncementsEnabled
    || foodReminder !== saved.foodReminderEnabled
    || foodTime !== savedFoodTime
    || weightReminder !== saved.weightReminderEnabled
    || weightTime !== savedWeightTime
    || quietStart !== saved.quietHoursStart.slice(0, 5)
    || quietEnd !== saved.quietHoursEnd.slice(0, 5);

  return <form action={formAction} className="flex flex-col gap-5">
    {state.message ? <p className="rounded-2xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm leading-6 text-primary" role="status">{state.message}</p> : null}
    <div className="grid gap-3">
      <ToggleSetting
        name="optionalBilling"
        checked={optionalBilling}
        onCheckedChange={setOptionalBilling}
        icon={<BellIcon className="size-4"/>}
        title="یادآوری‌های اختیاری پرداخت"
        description="با فعال‌سازی این گزینه، یادآوری تمدید یا پرداخت دریافت می‌کنید. رسیدها و اعلان‌های مهم حساب همیشه فعال می‌مانند."
      />
      <ToggleSetting
        name="optionalAnnouncements"
        checked={optionalAnnouncements}
        onCheckedChange={setOptionalAnnouncements}
        icon={<BellIcon className="size-4"/>}
        title="راهنمای مربی و اطلاع‌رسانی‌ها"
        description="پیشنهادهای اختیاری مربی، یادآوری تکمیل اطلاعات برنامه و خبرهای مهم جیرو. با غیرفعال‌کردن این گزینه دیگر این اعلان‌ها را دریافت نمی‌کنید."
      />
      <ToggleSetting
        name="foodReminder"
        checked={foodReminder}
        onCheckedChange={setFoodReminder}
        icon={<BellRingIcon className="size-4"/>}
        title="یادآوری ثبت غذا"
        description="پس از فعال‌سازی اعلان مرورگر، فقط از طریق Push یادآوری دریافت می‌کنید."
      >
        {foodReminder
          ? <Field data-invalid={Boolean(state.fieldErrors?.foodReminderTime)}>
              <FieldLabel htmlFor="food-reminder-time">زمان یادآوری</FieldLabel>
              <Input id="food-reminder-time" name="foodReminderTime" type="time" value={foodTime} onInput={(event) => setFoodTime(event.currentTarget.value)} aria-invalid={Boolean(state.fieldErrors?.foodReminderTime)}/>
              <FieldError>{state.fieldErrors?.foodReminderTime}</FieldError>
            </Field>
          : <input name="foodReminderTime" type="hidden" value={foodTime} readOnly/>}
      </ToggleSetting>
      <ToggleSetting
        name="weightReminder"
        checked={weightReminder}
        onCheckedChange={setWeightReminder}
        icon={<ScaleIcon className="size-4"/>}
        title="یادآور ثبت وزن"
        description="هر روز در ساعت انتخابی یادآوری می‌گیرید؛ اگر وزن آن روز ثبت شده باشد، یادآوری ارسال نمی‌شود."
      >
        {weightReminder
          ? <Field data-invalid={Boolean(state.fieldErrors?.weightReminderTime)}>
              <FieldLabel htmlFor="weight-reminder-time">زمان یادآوری</FieldLabel>
              <Input id="weight-reminder-time" name="weightReminderTime" type="time" value={weightTime} onInput={(event) => setWeightTime(event.currentTarget.value)} aria-invalid={Boolean(state.fieldErrors?.weightReminderTime)}/>
              <FieldError>{state.fieldErrors?.weightReminderTime}</FieldError>
            </Field>
          : <input name="weightReminderTime" type="hidden" value={weightTime} readOnly/>}
      </ToggleSetting>
    </div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field data-invalid={Boolean(state.fieldErrors?.quietHoursStart)}>
        <FieldLabel htmlFor="quiet-hours-start">شروع ساعات آرام</FieldLabel>
        <Input id="quiet-hours-start" name="quietHoursStart" type="time" value={quietStart} onInput={(event) => setQuietStart(event.currentTarget.value)} aria-invalid={Boolean(state.fieldErrors?.quietHoursStart)}/>
        <FieldError>{state.fieldErrors?.quietHoursStart}</FieldError>
      </Field>
      <Field data-invalid={Boolean(state.fieldErrors?.quietHoursEnd)}>
        <FieldLabel htmlFor="quiet-hours-end">پایان ساعات آرام</FieldLabel>
        <Input id="quiet-hours-end" name="quietHoursEnd" type="time" value={quietEnd} onInput={(event) => setQuietEnd(event.currentTarget.value)} aria-invalid={Boolean(state.fieldErrors?.quietHoursEnd)}/>
        <FieldError>{state.fieldErrors?.quietHoursEnd}</FieldError>
      </Field>
    </div>
    <SubmitButton hasChanges={hasChanges}/>
  </form>;
}

function ToggleSetting({name, checked, onCheckedChange, icon, title, description, children}: {
  name: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return <div className="rounded-2xl border p-4 transition-colors has-checked:border-primary/40 has-checked:bg-primary/5">
    <label className="flex cursor-pointer items-start gap-3">
      <input name={name} type="checkbox" checked={checked} onChange={(event) => onCheckedChange(event.target.checked)} className="mt-1 size-4 accent-primary"/>
      <span className="space-y-1"><span className="flex items-center gap-2 font-medium">{icon}{title}</span><span className="block text-sm leading-6 text-muted-foreground">{description}</span></span>
    </label>
    {children ? <div className="mt-4 ps-7">{children}</div> : null}
  </div>;
}

function SubmitButton({hasChanges}: {hasChanges: boolean}) {
  const {pending} = useFormStatus();
  return <Button type="submit" size="lg" variant={hasChanges ? "default" : "outline"} className="h-11 rounded-full transition-colors" disabled={pending || !hasChanges}>{pending ? <Spinner/> : <SaveIcon data-icon="inline-start"/>}{pending ? "در حال ذخیره" : "ذخیره تنظیمات"}</Button>;
}
