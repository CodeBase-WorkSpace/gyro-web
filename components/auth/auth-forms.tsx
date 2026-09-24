"use client";

import Link from "next/link";
import {
	createContext,
	useActionState,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { useFormStatus } from "react-dom";
import {
	ArrowLeftIcon,
	EyeIcon,
	EyeOffIcon,
	KeyRoundIcon,
	LogInIcon,
	MailIcon,
	RefreshCwIcon,
	ShieldCheckIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
	normalizeContactIdentifierForInput,
	validateContactIdentifier,
} from "@/lib/auth/contact";
import type { ActionState } from "@/lib/auth/types";
import { toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

type AuthAction = (
	prevState: ActionState,
	formData: FormData,
) => Promise<ActionState>;
type FormDispatch = (formData: FormData) => void;

const initialState: ActionState = {};
const AuthFormValidityContext = createContext<{
	hasInvalidFields: boolean;
	setFieldError: (field: string, error: string | null) => void;
} | null>(null);

const contactFieldProps = {
	normalizeValue: normalizeContactIdentifierForInput,
	validateValue: validateContactIdentifier,
};

export function LoginForm({
	action,
	nextPath = "/",
	resetComplete = false,
}: {
	action: AuthAction;
	nextPath?: string;
	resetComplete?: boolean;
}) {
	const [state, formAction] = useActionState(action, initialState);

	return (
		<AuthForm action={formAction}>
			<input type="hidden" name="next" value={nextPath} />
			<AuthToastFeedback
				error={state.message}
				feedbackKey={state}
				requestId={state.requestId}
				success={
					resetComplete
						? "رمز عبور تغییر کرد. اکنون می‌توانید با رمز عبور جدید وارد شوید."
						: undefined
				}
			/>
			<FieldGroup>
				<AuthField
					id="login-identifier"
					name="identifier"
					label="ایمیل یا شماره موبایل"
					placeholder="example@gyro.app یا 09123456789"
					autoComplete="username"
					defaultValue={state.formValues?.identifier}
					error={state.fieldErrors?.identifier}
					icon={<MailIcon aria-hidden="true" />}
					{...contactFieldProps}
				/>
				<AuthField
					id="login-password"
					name="password"
					type="password"
					label="رمز عبور"
					placeholder="رمز عبور حساب"
					autoComplete="current-password"
					defaultValue={state.formValues?.password}
					error={state.fieldErrors?.password}
					icon={<KeyRoundIcon aria-hidden="true" />}
				/>
			</FieldGroup>
			<div className="flex items-center justify-between gap-3 text-sm">
				<Link
					href="/auth/forgot-password"
					className="font-bold text-primary hover:underline"
				>
					رمز عبور را فراموش کرده‌اید؟
				</Link>
				<Link
					href="/auth/login/otp"
					className="text-muted-foreground hover:text-foreground"
				>
					ورود با کد یک‌بارمصرف
				</Link>
			</div>
			<SubmitButton
				label="ورود به جیرو"
				pendingLabel="در حال ورود"
				icon={<LogInIcon data-icon="inline-start" />}
			/>
		</AuthForm>
	);
}

export function LoginOtpStartForm({ action }: { action: AuthAction }) {
	const [state, formAction] = useActionState(action, initialState);

	return (
		<AuthForm action={formAction}>
			<AuthToastFeedback
				error={state.message}
				feedbackKey={state}
				requestId={state.requestId}
			/>
			<FieldGroup>
				<AuthField
					id="login-otp-identifier"
					name="identifier"
					label="ایمیل یا شماره موبایل"
					placeholder="حساب دریافت‌کننده کد ورود"
					autoComplete="username"
					defaultValue={state.formValues?.identifier}
					error={state.fieldErrors?.identifier}
					icon={<MailIcon aria-hidden="true" />}
					{...contactFieldProps}
				/>
			</FieldGroup>
			<SubmitButton
				label="ارسال کد ورود"
				pendingLabel="در حال ارسال کد"
				icon={<ShieldCheckIcon data-icon="inline-start" />}
			/>
		</AuthForm>
	);
}

export function LoginOtpConfirmForm({
	action,
	resendAction,
	defaultIdentifier = "",
}: {
	action: AuthAction;
	resendAction?: AuthAction;
	defaultIdentifier?: string;
}) {
	const [state, formAction] = useActionState(action, initialState);
	const [resendState, resendFormAction] = useActionState(
		resendAction ?? action,
		initialState,
	);

	return (
		<AuthForm action={formAction}>
			<AuthToastFeedback
				error={state.message ?? resendState.message}
				feedbackKey={state.message ? state : resendState}
				requestId={
					state.message ? state.requestId : resendState.requestId
				}
				success={resendState.successMessage}
			/>
			<FieldGroup>
				<AuthField
					id="login-otp-confirm-identifier"
					name="identifier"
					label="ایمیل یا شماره موبایل"
					placeholder="حساب دریافت‌کننده کد"
					autoComplete="username"
					defaultValue={
						state.formValues?.identifier ?? defaultIdentifier
					}
					error={state.fieldErrors?.identifier}
					icon={<MailIcon aria-hidden="true" />}
					{...contactFieldProps}
				/>
				<AuthField
					id="login-otp-confirm-code"
					name="code"
					label="کد ورود"
					placeholder="123456"
					inputMode="numeric"
					autoComplete="one-time-code"
					maxLength={6}
					dir="ltr"
					defaultValue={state.formValues?.code}
					error={state.fieldErrors?.code}
					icon={<ShieldCheckIcon aria-hidden="true" />}
					inputClassName="text-center text-lg font-bold tracking-[0.35em]"
				/>
			</FieldGroup>
			{resendAction ? (
				<ResendOtpControl
					action={resendFormAction}
					state={resendState}
					label="ارسال دوباره کد ورود"
				/>
			) : null}
			<SubmitButton
				label="ورود با کد"
				pendingLabel="در حال بررسی کد"
				icon={<LogInIcon data-icon="inline-start" />}
			/>
		</AuthForm>
	);
}

export function SignupForm({ action }: { action: AuthAction }) {
	const [state, formAction] = useActionState(action, initialState);

	return (
		<AuthForm action={formAction}>
			<AuthToastFeedback
				error={state.message}
				feedbackKey={state}
				requestId={state.requestId}
			/>
			<FieldGroup>
				<AuthField
					id="signup-identifier"
					name="identifier"
					label="ایمیل یا شماره موبایل"
					placeholder="برای ساخت حساب"
					autoComplete="username"
					defaultValue={state.formValues?.identifier}
					error={state.fieldErrors?.identifier}
					icon={<MailIcon aria-hidden="true" />}
					{...contactFieldProps}
				/>
			</FieldGroup>
			<p className="text-sm text-muted-foreground">
				یک کد یک‌بارمصرف برای شما ارسال می‌شود. برای ساخت حساب به رمز عبور نیازی نیست.
			</p>
			<SubmitButton
				label="دریافت کد و ساخت حساب"
				pendingLabel="در حال ارسال کد"
				icon={<ShieldCheckIcon data-icon="inline-start" />}
			/>
		</AuthForm>
	);
}

export function SignupVerifyForm({
	action,
	resendAction,
	defaultIdentifier = "",
}: {
	action: AuthAction;
	resendAction?: AuthAction;
	defaultIdentifier?: string;
}) {
	const [state, formAction] = useActionState(action, initialState);
	const [resendState, resendFormAction] = useActionState(
		resendAction ?? action,
		initialState,
	);

	return (
		<AuthForm action={formAction}>
			<AuthToastFeedback
				error={state.message ?? resendState.message}
				feedbackKey={state.message ? state : resendState}
				requestId={
					state.message ? state.requestId : resendState.requestId
				}
				success={resendState.successMessage}
			/>
			<FieldGroup>
				<AuthField
					id="signup-verify-identifier"
					name="identifier"
					label="ایمیل یا شماره موبایل"
					placeholder="حساب در انتظار تایید"
					autoComplete="username"
					defaultValue={
						state.formValues?.identifier ?? defaultIdentifier
					}
					error={state.fieldErrors?.identifier}
					icon={<MailIcon aria-hidden="true" />}
					{...contactFieldProps}
				/>
				<AuthField
					id="signup-verify-code"
					name="code"
					label="کد تایید"
					placeholder="123456"
					inputMode="numeric"
					autoComplete="one-time-code"
					maxLength={6}
					dir="ltr"
					defaultValue={state.formValues?.code}
					error={state.fieldErrors?.code}
					icon={<ShieldCheckIcon aria-hidden="true" />}
					inputClassName="text-center text-lg font-bold tracking-[0.35em]"
				/>
			</FieldGroup>
			<FieldDescription className="text-right">
				پس از تایید کد، حساب ساخته می‌شود و مستقیم وارد جیرو می‌شوید.
			</FieldDescription>
			{resendAction ? (
				<ResendOtpControl
					action={resendFormAction}
					state={resendState}
					label="ارسال دوباره کد تایید"
				/>
			) : null}
			<SubmitButton
				label="تایید و ورود"
				pendingLabel="در حال تایید"
				icon={<ShieldCheckIcon data-icon="inline-start" />}
			/>
		</AuthForm>
	);
}

export function ForgotPasswordForm({ action }: { action: AuthAction }) {
	const [state, formAction] = useActionState(action, initialState);

	return (
		<AuthForm action={formAction}>
			<AuthToastFeedback
				error={state.message}
				feedbackKey={state}
				requestId={state.requestId}
				success={state.successMessage}
			/>
			<FieldGroup>
				<AuthField
					id="forgot-identifier"
					name="identifier"
					label="ایمیل یا شماره موبایل"
					placeholder="حسابی که می‌خواهید بازیابی کنید"
					autoComplete="username"
					defaultValue={state.formValues?.identifier}
					error={state.fieldErrors?.identifier}
					icon={<MailIcon aria-hidden="true" />}
					{...contactFieldProps}
				/>
			</FieldGroup>
			<SubmitButton
				label="ارسال کد بازیابی"
				pendingLabel="در حال ارسال"
				icon={<ShieldCheckIcon data-icon="inline-start" />}
			/>
			<Link
				href="/auth/otp"
				className={cn(
					buttonVariants({ variant: "secondary", size: "lg" }),
					"h-12 rounded-full",
				)}
			>
				کد را دریافت کرده‌ام
				<ArrowLeftIcon data-icon="inline-end" />
			</Link>
		</AuthForm>
	);
}

export function OtpForm({
	action,
	resendAction,
	defaultIdentifier = "",
}: {
	action: AuthAction;
	resendAction?: AuthAction;
	defaultIdentifier?: string;
}) {
	const [state, formAction] = useActionState(action, initialState);
	const [resendState, resendFormAction] = useActionState(
		resendAction ?? action,
		initialState,
	);

	return (
		<AuthForm action={formAction}>
			<AuthToastFeedback
				error={state.message ?? resendState.message}
				feedbackKey={state.message ? state : resendState}
				requestId={
					state.message ? state.requestId : resendState.requestId
				}
				success={resendState.successMessage}
			/>
			<FieldGroup>
				<AuthField
					id="otp-identifier"
					name="identifier"
					label="ایمیل یا شماره موبایل"
					placeholder="حساب دریافت‌کننده کد"
					autoComplete="username"
					defaultValue={
						state.formValues?.identifier ?? defaultIdentifier
					}
					error={state.fieldErrors?.identifier}
					icon={<MailIcon aria-hidden="true" />}
					{...contactFieldProps}
				/>
				<AuthField
					id="otp-code"
					name="code"
					label="کد یک‌بارمصرف"
					placeholder="123456"
					inputMode="numeric"
					autoComplete="one-time-code"
					maxLength={6}
					dir="ltr"
					defaultValue={state.formValues?.code}
					error={state.fieldErrors?.code}
					icon={<ShieldCheckIcon aria-hidden="true" />}
					inputClassName="text-center text-lg font-bold tracking-[0.35em]"
				/>
				<AuthField
					id="otp-new-password"
					name="newPassword"
					type="password"
					label="رمز عبور جدید"
					placeholder="رمز عبور تازه"
					autoComplete="new-password"
					defaultValue={state.formValues?.newPassword}
					error={state.fieldErrors?.newPassword}
					icon={<KeyRoundIcon aria-hidden="true" />}
				/>
			</FieldGroup>
			<FieldDescription className="text-right">
				کد بازیابی معمولا چند دقیقه معتبر است. اگر کد منقضی شد، همین‌جا
				کد تازه بگیرید.
			</FieldDescription>
			{resendAction ? (
				<ResendOtpControl
					action={resendFormAction}
					state={resendState}
					label="ارسال دوباره کد بازیابی"
				/>
			) : null}
			<SubmitButton
				label="ثبت رمز عبور جدید"
				pendingLabel="در حال بررسی کد"
				icon={<ShieldCheckIcon data-icon="inline-start" />}
			/>
		</AuthForm>
	);
}

function ResendOtpControl({
	action,
	state,
	label,
}: {
	action: FormDispatch;
	state: ActionState;
	label: string;
}) {
	const [remainingSeconds, setRemainingSeconds] = useState(60);
	const { pending } = useFormStatus();
	const validity = useAuthFormValidity();

	useEffect(() => {
		setRemainingSeconds(60);
	}, [state.successMessage]);

	useEffect(() => {
		if (remainingSeconds <= 0) return;

		const timer = window.setInterval(() => {
			setRemainingSeconds((current) => Math.max(0, current - 1));
		}, 1000);

		return () => window.clearInterval(timer);
	}, [remainingSeconds]);

	const disabled = pending || validity.hasInvalidFields || remainingSeconds > 0;
	const countdownLabel =
		remainingSeconds > 0
			? `${toPersianDigits(remainingSeconds)} ثانیه تا ارسال دوباره`
			: label;

	return (
		<div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm">
			<span className="text-muted-foreground">{countdownLabel}</span>
			<Button
				type="submit"
				formAction={action}
				variant="secondary"
				size="sm"
				className="h-9 shrink-0 rounded-full px-3 text-xs font-bold"
				disabled={disabled}
			>
				{pending ? (
					<Spinner data-icon="inline-start" />
				) : (
					<RefreshCwIcon data-icon="inline-start" />
				)}
				ارسال دوباره
			</Button>
		</div>
	);
}

function AuthForm({
	action,
	children,
}: {
	action: (formData: FormData) => void;
	children: React.ReactNode;
}) {
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const hasInvalidFields = Object.values(fieldErrors).some(Boolean);

	function setFieldError(field: string, error: string | null) {
		setFieldErrors((current) => {
			if (current[field] === (error ?? "")) return current;
			return {
				...current,
				[field]: error ?? "",
			};
		});
	}

	return (
		<AuthFormValidityContext.Provider
			value={{
				hasInvalidFields,
				setFieldError,
			}}
		>
			<form
				action={action}
				className="flex animate-[auth-content-in_240ms_ease-out_80ms_both] flex-col gap-5"
			>
				{children}
			</form>
		</AuthFormValidityContext.Provider>
	);
}

function AuthField({
	id,
	name,
	label,
	error,
	icon,
	inputClassName,
	defaultValue,
	onChange,
	normalizeValue,
	validateValue,
	type,
	...inputProps
}: React.ComponentProps<typeof Input> & {
	id: string;
	name: string;
	label: string;
	error?: string;
	icon: React.ReactNode;
	inputClassName?: string;
	normalizeValue?: (value: string) => string;
	validateValue?: (value: string) => string | null;
}) {
	const validity = useAuthFormValidity();
	const [value, setValue] = useState(() => valueFromDefault(defaultValue));
	const [touched, setTouched] = useState(false);
	const [passwordVisible, setPasswordVisible] = useState(false);
	const isPassword = type === "password";
	const liveError = touched && validateValue ? validateValue(value) : null;
	const displayedError = liveError ?? error;
	const invalid = Boolean(displayedError);

	useEffect(() => {
		setValue(valueFromDefault(defaultValue));
	}, [defaultValue]);

	useEffect(() => {
		if (!validateValue) return;
		validity.setFieldError(id, validateValue(value));
	}, [id, validateValue, value, validity]);

	return (
		<Field
			data-invalid={invalid}
			className="transition-[color,transform] duration-200 data-[invalid=true]:translate-y-0.5"
		>
			<FieldLabel htmlFor={id} className="text-sm font-bold">
				{label}
			</FieldLabel>
			<div className="relative">
				<span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground transition-colors duration-200 group-data-[invalid=true]/field:text-destructive [&_svg:not([class*='size-'])]:size-4">
					{icon}
				</span>
				<Input
					id={id}
					name={name}
					type={isPassword && passwordVisible ? "text" : type}
					aria-invalid={invalid}
					value={value}
					onChange={(event) => {
						const normalizedValue = normalizeValue
							? normalizeValue(event.currentTarget.value)
							: event.currentTarget.value;
						setTouched(true);
						setValue(normalizedValue);
						onChange?.(event);
					}}
					className={cn(
						"h-12 rounded-2xl bg-input pr-10 text-right transition-[border-color,box-shadow,background-color] duration-200",
						isPassword && "pl-10",
						inputClassName,
					)}
					{...inputProps}
				/>
				{isPassword ? (
					<button
						type="button"
						className="absolute inset-y-0 left-3 flex items-center text-muted-foreground transition-[color,transform] duration-200 hover:scale-105 hover:text-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
						aria-label={
							passwordVisible
								? "پنهان کردن رمز عبور"
								: "نمایش رمز عبور"
						}
						aria-pressed={passwordVisible}
						onClick={() =>
							setPasswordVisible((current) => !current)
						}
					>
						<span
							key={passwordVisible ? "hidden" : "visible"}
							className="animate-[auth-icon-swap_160ms_ease-out]"
						>
							{passwordVisible ? (
								<EyeOffIcon aria-hidden="true" />
							) : (
								<EyeIcon aria-hidden="true" />
							)}
						</span>
					</button>
				) : null}
			</div>
			<div
				className={cn(
					"grid transition-[grid-template-rows,opacity,margin] duration-200 ease-out",
					displayedError
						? "mt-0 grid-rows-[1fr] opacity-100"
						: "-mt-2 grid-rows-[0fr] opacity-0",
				)}
			>
				<div className="overflow-hidden">
					{displayedError ? (
						<FieldError
							key={displayedError}
							className="animate-[auth-error-in_180ms_ease-out]"
						>
							{displayedError}
						</FieldError>
					) : null}
				</div>
			</div>
		</Field>
	);
}

function valueFromDefault(
	defaultValue: React.ComponentProps<typeof Input>["defaultValue"],
) {
	if (Array.isArray(defaultValue)) {
		return String(defaultValue[0] ?? "");
	}

	return String(defaultValue ?? "");
}

function SubmitButton({
	label,
	pendingLabel,
	icon,
}: {
	label: string;
	pendingLabel: string;
	icon: React.ReactNode;
}) {
	const { pending } = useFormStatus();
	const validity = useAuthFormValidity();

	return (
		<Button
			type="submit"
			size="lg"
			className="h-12 rounded-full text-sm font-bold"
			disabled={pending || validity.hasInvalidFields}
		>
			{pending ? <Spinner data-icon="inline-start" /> : icon}
			{pending ? pendingLabel : label}
		</Button>
	);
}

function useAuthFormValidity() {
	return (
		useContext(AuthFormValidityContext) ?? {
			hasInvalidFields: false,
			setFieldError: () => undefined,
		}
	);
}

function AuthToastFeedback({
	error,
	success,
	feedbackKey,
	requestId,
}: {
	error?: string;
	success?: string;
	feedbackKey?: unknown;
	requestId?: string;
}) {
	const shownToastKeys = useRef(new Set<string>());

	useEffect(() => {
		if (error) {
			toast.error("درخواست انجام نشد", {
				description: requestId
					? `${error}\nشناسه پیگیری: ${requestId}`
					: error,
			});
		}
	}, [error, feedbackKey, requestId]);

	useEffect(() => {
		if (success) {
			const key = `success:${success}`;

			if (!shownToastKeys.current.has(key)) {
				shownToastKeys.current.add(key);
				toast.success(success);
			}
		}
	}, [success]);

	return null;
}
