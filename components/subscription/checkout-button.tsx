"use client";

import {
	useActionState,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { useFormStatus } from "react-dom";
import {
	CheckCircle2Icon,
	CreditCardIcon,
	GiftIcon,
	Loader2Icon,
} from "lucide-react";
import { toast } from "sonner";

import {
	checkoutAction,
	type CheckoutActionState,
	redeemPromotionAction,
	type PromotionValidationActionState,
} from "@/app/_actions/checkout";
import { PromotionCodeInput } from "@/components/subscription/promotion-code-input";
import { Button } from "@/components/ui/button";
import { CelebrationConfetti } from "@/components/ui/celebration-confetti";
import type { BillingPurchaseContext } from "@/lib/subscription/billing-presentation";
import {
	billingPeriodLabel,
	catalogPricePresentation,
	formatMoney,
	type PlanPrice,
} from "@/lib/subscription/plans";
import type { PromotionValidationResponse } from "@/lib/api/checkout";
import { cn } from "@/lib/utils";

type PlanCheckoutFormProps = {
	prices: PlanPrice[];
	featured?: boolean;
	purchaseContext?: BillingPurchaseContext;
};

const checkoutInitialState: CheckoutActionState = { status: "idle" };
const redemptionInitialState: PromotionValidationActionState = {
	status: "idle",
};

export function PlanCheckoutForm({
	prices,
	featured = false,
	purchaseContext = "NEW",
}: PlanCheckoutFormProps) {
	const sortedPrices = useMemo(
		() =>
			[...prices].sort(
				(a, b) => a.billingPeriodDays - b.billingPeriodDays,
			),
		[prices],
	);
	const [selectedPriceId, setSelectedPriceId] = useState(
		sortedPrices[1]?.id?.toString() ?? "",
	);
	const [checkoutState, checkoutFormAction] = useActionState(
		checkoutAction,
		checkoutInitialState,
	);
	const [redemptionState, redemptionFormAction] = useActionState(
		redeemPromotionAction,
		redemptionInitialState,
	);
	const [promotion, setPromotion] =
		useState<PromotionValidationResponse | null>(null);
	const [hasPromotionDraft, setHasPromotionDraft] = useState(false);
	const onPromotionApplied = useCallback(
		(value: PromotionValidationResponse | null) => {
			setPromotion(value);
		},
		[],
	);
	const onPromotionDraftChange = useCallback((hasDraft: boolean) => {
		setHasPromotionDraft(hasDraft);
	}, []);
	const selectedPrice =
		sortedPrices.find((price) => price.id.toString() === selectedPriceId) ??
		null;

	useEffect(() => {
		if (checkoutState.status === "error" && checkoutState.error) {
			toast.error(checkoutState.error);
		}
	}, [checkoutState]);

	useEffect(() => {
		if (redemptionState.status === "error" && redemptionState.error) {
			toast.error(redemptionState.error);
		}
		if (redemptionState.status === "success") {
			toast.success(redemptionState.message ?? "دسترسی رایگان فعال شد.");
		}
	}, [redemptionState]);

	const isFreeActivation = promotion?.redemptionMode === "FREE_ACTIVATION";
	const redemptionSucceeded = redemptionState.status === "success";

	return (
		<form action={checkoutFormAction} className="grid gap-3">
			<CelebrationConfetti active={redemptionSucceeded} />
			<input type="hidden" name="priceId" value={selectedPriceId} />

			<fieldset className="grid gap-2" aria-label="انتخاب دوره اشتراک">
				{sortedPrices.map((price) => (
					<label
						key={price.id}
						className={cn(
							"grid cursor-pointer gap-2 rounded-2xl border bg-card/70 p-3 transition-colors",
							selectedPriceId === price.id.toString()
								? "border-primary bg-primary/10"
								: "hover:bg-muted/45",
						)}
					>
						<span className="flex items-start justify-between gap-3">
							<span className="flex min-w-0 items-start gap-2">
								<input
									type="radio"
									name="priceOption"
									value={price.id}
									checked={
										selectedPriceId === price.id.toString()
									}
									onChange={() =>
										setSelectedPriceId(price.id.toString())
									}
									className="mt-1 size-4 accent-primary"
								/>
								<span className="grid gap-1">
									<span className="text-sm font-black">
										{billingPeriodLabel(
											price.billingPeriodDays,
										)}
									</span>
									<span className="text-xs font-semibold leading-5 text-muted-foreground">
										{billingPeriodHelp(
											price.billingPeriodDays,
										)}
									</span>
								</span>
							</span>
							<CatalogPriceDisplay price={price} />
						</span>
						{price.badge ? (
							<span className="w-fit rounded-full border px-2 py-0.5 text-[0.65rem] font-black text-primary">
								{priceBadgeLabel(price.badge)}
							</span>
						) : null}
					</label>
				))}
			</fieldset>

			<PromotionCodeInput
				selectedPriceId={selectedPriceId}
				onApplied={onPromotionApplied}
				onDraftChange={onPromotionDraftChange}
			/>

			{selectedPrice ? (
				<CheckoutPriceSummary
					price={selectedPrice}
					promotion={promotion}
					purchaseContext={purchaseContext}
				/>
			) : null}

			<CheckoutSubmitButton
				featured={featured}
				freeActivation={isFreeActivation}
				redemptionSucceeded={redemptionSucceeded}
				redemptionAction={redemptionFormAction}
				hasPromotionDraft={hasPromotionDraft}
				purchaseContext={purchaseContext}
			/>
			{redemptionSucceeded ? (
				<p
					className="flex items-center justify-center gap-2 text-sm font-black text-primary"
					role="status"
				>
					<CheckCircle2Icon className="size-5" aria-hidden="true" />
					{redemptionState.message ?? "کد با موفقیت اعمال شد."}
				</p>
			) : null}
		</form>
	);
}

function CheckoutPriceSummary({
	price,
	promotion,
	purchaseContext,
}: {
	price: PlanPrice;
	promotion: PromotionValidationResponse | null;
	purchaseContext: BillingPurchaseContext;
}) {
	const catalogPrice = catalogPricePresentation(price);
	const finalAmount = promotion?.amountAfterDiscount ?? {
		amount: price.amount,
		currency: price.currency,
	};
	const discount = promotion?.discountAmount.amount ?? 0;
	const extraDays = promotion?.freeDays;
	const isFreeActivation = promotion?.redemptionMode === "FREE_ACTIVATION";

	return (
		<section
			className="overflow-hidden rounded-2xl border bg-card shadow-sm"
			aria-label="خلاصه پرداخت"
		>
			<div className="flex items-center justify-between gap-3 px-4 py-3">
				<div>
					<p className="text-sm font-black">خلاصه پرداخت</p>
					<p className="mt-0.5 text-xs font-semibold text-muted-foreground">
						{billingPeriodLabel(price.billingPeriodDays)} · پرداخت
						امن
					</p>
				</div>
				{promotion ? (
					<span className="rounded-full bg-primary/10 px-2 py-1 text-[0.65rem] font-black text-primary">
						{promotion.promotionCode}
					</span>
				) : null}
			</div>
			<div className="border-y bg-muted/25 px-4 py-3 text-sm">
				{catalogPrice.discounted ? (
					<div className="flex items-center justify-between gap-3">
						<span className="text-muted-foreground">قیمت پایه</span>
						<span className="text-muted-foreground line-through">
							{catalogPrice.basePrice}
						</span>
					</div>
				) : null}
				<div className={cn("flex items-center justify-between gap-3", catalogPrice.discounted ? "mt-2" : "")}>
					<span className="text-muted-foreground">
						{catalogPrice.discounted ? "قیمت کاتالوگ" : "قیمت دوره"}
					</span>
					<span
						className={
							discount > 0
								? "text-muted-foreground line-through"
								: "font-bold"
						}
					>
						{catalogPrice.finalPrice}
					</span>
				</div>
				{discount > 0 ? (
					<div className="mt-2 flex items-center justify-between gap-3 text-primary">
						<span className="font-bold">تخفیف</span>
						<span className="font-black">
							−{formatMoney(discount, finalAmount.currency)}
						</span>
					</div>
				) : null}
				{extraDays ? (
					<div className="mt-2 flex items-center justify-between gap-3 text-primary">
						<span className="font-bold">روزهای هدیه</span>
						<span className="font-black">
							{extraDays.toLocaleString("fa-IR")} روز
						</span>
					</div>
				) : null}
			</div>
			<div className="flex items-end justify-between gap-3 px-4 py-4">
				<div>
					<p className="text-sm font-black">مبلغ نهایی</p>
					<p className="mt-1 text-xs font-semibold leading-5 text-muted-foreground">
						{isFreeActivation
							? "دسترسی رایگان با کد فعال می‌شود"
							: purchaseContext === "TRIAL_EXTENSION"
								? "این مدت بعد از دوره آزمایشی اضافه می‌شود"
								: purchaseContext === "RENEWAL"
									? "این مدت به پایان اشتراک فعلی اضافه می‌شود"
									: "مبلغ نهایی در درگاه پرداخت تأیید می‌شود"}
					</p>
				</div>
				<strong className="text-left text-xl font-black tracking-tight text-primary">
					{isFreeActivation
						? "رایگان"
						: formatMoney(finalAmount.amount, finalAmount.currency)}
				</strong>
			</div>
		</section>
	);
}

function CatalogPriceDisplay({price}: {price: PlanPrice}) {
	const presentation = catalogPricePresentation(price);
	return (
		<span className="grid shrink-0 gap-1 text-left">
			<span className="text-sm font-black tabular-nums tracking-normal">
				{presentation.finalPrice}
			</span>
			{presentation.basePrice ? (
				<span className="text-xs font-bold text-muted-foreground line-through">
					{presentation.basePrice}
				</span>
			) : null}
			{presentation.discountLabel ? (
				<span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-black text-primary">
					{presentation.discountLabel}
				</span>
			) : null}
		</span>
	);
}

function CheckoutSubmitButton({
	featured,
	freeActivation,
	redemptionSucceeded,
	redemptionAction,
	hasPromotionDraft,
	purchaseContext,
}: {
	featured: boolean;
	freeActivation: boolean;
	redemptionSucceeded: boolean;
	redemptionAction: (payload: FormData) => void;
	hasPromotionDraft: boolean;
	purchaseContext: BillingPurchaseContext;
}) {
	const { pending } = useFormStatus();

	return (
		<Button
			type="submit"
			variant={featured ? "default" : "outline"}
			disabled={pending || redemptionSucceeded || hasPromotionDraft}
			formAction={freeActivation ? redemptionAction : undefined}
			className="w-full"
		>
			{redemptionSucceeded ? (
				<CheckCircle2Icon data-icon="inline-start" />
			) : pending ? (
				<Loader2Icon
					className="animate-spin"
					data-icon="inline-start"
				/>
			) : freeActivation ? (
				<GiftIcon data-icon="inline-start" />
			) : (
				<CreditCardIcon data-icon="inline-start" />
			)}
			{redemptionSucceeded
				? "اعمال شد"
				: pending
					? hasPromotionDraft
						? "در حال بررسی کد..."
						: freeActivation
							? "در حال اعمال..."
							: "در حال اتصال..."
					: hasPromotionDraft
						? "ابتدا کد را اعمال کن"
						: freeActivation
							? "اعمال"
							: purchaseContext === "TRIAL_EXTENSION"
								? "خرید و افزودن مدت"
								: purchaseContext === "RENEWAL"
									? "خرید و تمدید"
									: "رفتن به درگاه پرداخت"}
		</Button>
	);
}

function billingPeriodHelp(days: number) {
	switch (days) {
		case 30:
			return "پرداخت ماهانه برای شروع کوتاه‌مدت.";
		case 90:
			return "سه ماه پیگیری با هزینه کمتر از پرداخت ماهانه.";
		case 365:
			return "به‌صرفه‌ترین گزینه برای استفاده بلندمدت.";
		default:
			return "پرداخت برای همین بازه انجام می‌شود.";
	}
}

function priceBadgeLabel(badge: string) {
	switch (badge) {
		case "RECOMMENDED":
			return "پیشنهادی";
		case "BEST_VALUE":
			return "به‌صرفه‌تر";
		default:
			return badge;
	}
}
