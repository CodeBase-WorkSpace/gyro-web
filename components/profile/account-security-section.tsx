"use client";

import type {ReactNode} from "react";
import {useActionState} from "react";
import {useFormStatus} from "react-dom";
import {KeyRoundIcon, ShieldCheckIcon, ShieldOffIcon, Trash2Icon} from "lucide-react";

import {Button} from "@/components/ui/button";
import {Field, FieldError, FieldGroup, FieldLabel} from "@/components/ui/field";
import {Input} from "@/components/ui/input";
import {Spinner} from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type {ActionState} from "@/lib/auth/types";

type SecurityAction = (prevState: ActionState, formData: FormData) => Promise<ActionState>;

type AccountSecuritySectionProps = {
  hasPassword: boolean;
  setPasswordAction: SecurityAction;
  changePasswordAction: SecurityAction;
  removePasswordAction: SecurityAction;
  startStepUpAction: SecurityAction;
  confirmStepUpAction: SecurityAction;
};

const initialState: ActionState = {};

export function AccountSecuritySection({
  hasPassword,
  setPasswordAction,
  changePasswordAction,
  removePasswordAction,
  startStepUpAction,
  confirmStepUpAction,
}: AccountSecuritySectionProps) {
  return (
    <div className="flex flex-col gap-5">
      <p className="rounded-2xl bg-muted/40 px-3 py-2 text-sm leading-6 text-muted-foreground">
        {hasPassword
          ? "برای حساب شما رمز عبور تنظیم شده است. می‌توانید آن را تغییر دهید یا حذف کنید و فقط با کد یک‌بارمصرف وارد شوید."
          : "برای حساب شما رمز عبوری تنظیم نشده است. با تنظیم رمز عبور، علاوه بر کد یک‌بارمصرف می‌توانید با رمز هم وارد شوید."}
      </p>

      {hasPassword ? (
        <>
          <ChangePasswordForm action={changePasswordAction} />
          <RemovePasswordSection
            removeAction={removePasswordAction}
            startStepUpAction={startStepUpAction}
            confirmStepUpAction={confirmStepUpAction}
          />
        </>
      ) : (
        <StepUpGate
          startStepUpAction={startStepUpAction}
          confirmStepUpAction={confirmStepUpAction}
          description="برای تنظیم رمز عبور، ابتدا هویت خود را با یک کد یک‌بارمصرف تایید کنید."
        >
          <SetPasswordForm action={setPasswordAction}/>
        </StepUpGate>
      )}
    </div>
  );
}

// Sends an OTP to the user's verified identifier and, once confirmed, renders its children.
// The sensitive action inside is only reachable after a fresh server-side step-up.
function StepUpGate({
                      startStepUpAction,
                      confirmStepUpAction,
                      description,
                      children,
                    }: {
  startStepUpAction: SecurityAction;
  confirmStepUpAction: SecurityAction;
  description: string;
  children: ReactNode;
}) {
  const [startState, startFormAction] = useActionState(startStepUpAction, initialState);
  const [confirmState, confirmFormAction] = useActionState(confirmStepUpAction, initialState);

  const codeSent = Boolean(startState.successMessage);
  const verified = Boolean(confirmState.successMessage);

  if (verified) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      <form action={startFormAction}>
        <FeedbackBanner state={startState}/>
        <SubmitButton
          label={codeSent ? "ارسال دوباره کد تایید" : "ارسال کد تایید"}
          pendingLabel="در حال ارسال کد"
          icon={<ShieldCheckIcon data-icon="inline-start"/>}
          variant="outline"
        />
      </form>

      {codeSent ? (
        <form action={confirmFormAction} className="flex flex-col gap-3">
          <FeedbackBanner state={confirmState}/>
          <Field data-invalid={Boolean(confirmState.fieldErrors?.code)}>
            <FieldLabel htmlFor="step-up-code" className="items-center">
              <ShieldCheckIcon aria-hidden="true"/>
              کد تایید
            </FieldLabel>
            <Input
              id="step-up-code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              dir="ltr"
              className="text-center tracking-[0.35em]"
              aria-invalid={Boolean(confirmState.fieldErrors?.code)}
            />
            <FieldError>{confirmState.fieldErrors?.code}</FieldError>
          </Field>
          <SubmitButton
            label="تایید کد"
            pendingLabel="در حال تایید"
            icon={<ShieldCheckIcon data-icon="inline-start"/>}
            variant="outline"
          />
        </form>
      ) : null}
    </div>
  );
}

function SetPasswordForm({action}: {action: SecurityAction}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FeedbackBanner state={state} />
      <FieldGroup>
        <PasswordField
          id="set-new-password"
          name="newPassword"
          label="رمز عبور جدید"
          placeholder="حداقل ۹ نویسه، حرف بزرگ، حرف کوچک و عدد"
          autoComplete="new-password"
          error={state.fieldErrors?.newPassword}
        />
        <PasswordField
          id="set-confirm-password"
          name="confirmPassword"
          label="تکرار رمز عبور"
          placeholder="رمز عبور را دوباره وارد کنید"
          autoComplete="new-password"
          error={state.fieldErrors?.confirmPassword}
        />
      </FieldGroup>
      <SubmitButton label="تنظیم رمز عبور" pendingLabel="در حال ذخیره" icon={<KeyRoundIcon data-icon="inline-start" />} />
    </form>
  );
}

function ChangePasswordForm({action}: {action: SecurityAction}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FeedbackBanner state={state} />
      <FieldGroup>
        <PasswordField
          id="change-current-password"
          name="currentPassword"
          label="رمز عبور فعلی"
          placeholder="رمز عبور فعلی حساب"
          autoComplete="current-password"
          error={state.fieldErrors?.currentPassword ?? state.fieldErrors?.password}
        />
        <PasswordField
          id="change-new-password"
          name="newPassword"
          label="رمز عبور جدید"
          placeholder="حداقل ۹ نویسه، حرف بزرگ، حرف کوچک و عدد"
          autoComplete="new-password"
          error={state.fieldErrors?.newPassword}
        />
        <PasswordField
          id="change-confirm-password"
          name="confirmPassword"
          label="تکرار رمز عبور جدید"
          placeholder="رمز عبور جدید را دوباره وارد کنید"
          autoComplete="new-password"
          error={state.fieldErrors?.confirmPassword}
        />
      </FieldGroup>
      <SubmitButton label="تغییر رمز عبور" pendingLabel="در حال ذخیره" icon={<KeyRoundIcon data-icon="inline-start" />} />
    </form>
  );
}

function RemovePasswordSection({
  removeAction,
  startStepUpAction,
  confirmStepUpAction,
}: {
  removeAction: SecurityAction;
  startStepUpAction: SecurityAction;
  confirmStepUpAction: SecurityAction;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
      <div className="flex items-center gap-2 text-destructive">
        <ShieldOffIcon aria-hidden="true" className="size-4" />
        <strong className="text-sm">حذف رمز عبور</strong>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">
        با حذف رمز عبور، ورود شما فقط با کد یک‌بارمصرف انجام می‌شود. برای امنیت، ابتدا هویت خود را با یک کد تایید کنید.
      </p>
      <StepUpGate
        startStepUpAction={startStepUpAction}
        confirmStepUpAction={confirmStepUpAction}
        description="برای حذف رمز عبور، هویت خود را با یک کد یک‌بارمصرف تایید کنید."
      >
        <RemovePasswordConfirm removeAction={removeAction}/>
      </StepUpGate>
    </div>
  );
}

function RemovePasswordConfirm({removeAction}: { removeAction: SecurityAction }) {
  const [removeState, removeFormAction] = useActionState(removeAction, initialState);

  return (
    <div className="flex flex-col gap-3">
      <FeedbackBanner state={removeState}/>
      <AlertDialog>
        <AlertDialogTrigger
          render={<Button type="button" variant="destructive" size="lg" className="h-11 rounded-full"/>}
        >
          <Trash2Icon data-icon="inline-start"/>
          حذف رمز عبور
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف رمز عبور حساب</AlertDialogTitle>
            <AlertDialogDescription>
              پس از حذف، دیگر نمی‌توانید با رمز عبور وارد شوید و ورود فقط با کد یک‌بارمصرف انجام می‌شود. مطمئن هستید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <form action={removeFormAction}>
              <RemoveConfirmButton/>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PasswordField({
  id,
  name,
  label,
  placeholder,
  autoComplete,
  error,
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  autoComplete: string;
  error?: string;
}) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id} className="items-center">
        <KeyRoundIcon aria-hidden="true" />
        {label}
      </FieldLabel>
      <Input
        id={id}
        name={name}
        type="password"
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
      />
      <FieldError>{error}</FieldError>
    </Field>
  );
}

function FeedbackBanner({state}: {state: ActionState}) {
  if (state.message) {
    return (
      <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm leading-6 text-destructive">
        {state.message}
      </p>
    );
  }

  if (state.successMessage) {
    return (
      <p className="rounded-2xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm leading-6 text-primary">
        {state.successMessage}
      </p>
    );
  }

  return null;
}

function SubmitButton({
  label,
  pendingLabel,
  icon,
  variant = "default",
}: {
  label: string;
  pendingLabel: string;
  icon: ReactNode;
  variant?: "default" | "outline";
}) {
  const {pending} = useFormStatus();

  return (
    <Button type="submit" variant={variant} size="lg" className="h-11 rounded-full" disabled={pending}>
      {pending ? <Spinner /> : icon}
      {pending ? pendingLabel : label}
    </Button>
  );
}

function RemoveConfirmButton() {
  const {pending} = useFormStatus();

  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? <Spinner /> : <Trash2Icon data-icon="inline-start" />}
      {pending ? "در حال حذف" : "حذف رمز عبور"}
    </Button>
  );
}
