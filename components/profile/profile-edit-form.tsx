"use client";

import type {ReactNode} from "react";
import {useActionState} from "react";
import {useFormStatus} from "react-dom";
import {SaveIcon, UserRoundIcon} from "lucide-react";

import {Button} from "@/components/ui/button";
import {Field, FieldError, FieldGroup, FieldLabel} from "@/components/ui/field";
import {Input} from "@/components/ui/input";
import {Spinner} from "@/components/ui/spinner";
import type {ActionState} from "@/lib/auth/types";

type ProfileEditFormProps = {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  user: {
    displayName?: string | null;
    timezone: string;
    locale: string;
  };
};

const initialState: ActionState = {};

export function ProfileEditForm({ action, user }: ProfileEditFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const locale = state.formValues?.locale || user.locale;
  const timezone = state.formValues?.timezone || user.timezone;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.message ? (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm leading-6 text-destructive">
          {state.message}
        </p>
      ) : null}
      <FieldGroup>
        <ProfileField
          id="profile-display-name"
          name="displayName"
          label="نام نمایشی"
          placeholder="مثلا کاوه"
          defaultValue={state.formValues?.displayName ?? user.displayName ?? ""}
          error={state.fieldErrors?.displayName}
          icon={<UserRoundIcon aria-hidden="true" />}
        />
        <input type="hidden" name="locale" value={locale}/>
        <input type="hidden" name="timezone" value={timezone}/>
      </FieldGroup>
      <ProfileSubmitButton />
    </form>
  );
}

function ProfileField({
  id,
  name,
  label,
  placeholder,
  defaultValue,
  error,
  icon,
  dir,
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  defaultValue?: string;
  error?: string;
  icon: ReactNode;
  dir?: "ltr" | "rtl";
}) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id} className="items-center">
        {icon}
        {label}
      </FieldLabel>
      <Input
        id={id}
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
        aria-invalid={Boolean(error)}
        dir={dir}
      />
      <FieldError>{error}</FieldError>
    </Field>
  );
}

function ProfileSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className="h-11 rounded-full" disabled={pending}>
      {pending ? <Spinner /> : <SaveIcon data-icon="inline-start" />}
      {pending ? "در حال ذخیره" : "ذخیره پروفایل"}
    </Button>
  );
}
