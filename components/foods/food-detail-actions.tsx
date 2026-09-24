"use client";

import {AlertCircleIcon, ArchiveIcon, CheckCircle2Icon, CopyIcon, EditIcon, HeartIcon,} from "lucide-react";
import {useActionState, useEffect, useMemo, useState} from "react";
import Link from "next/link";
import {useFormStatus} from "react-dom";
import {toast} from "sonner";

import {
	archiveCustomFoodAction,
	type FoodMutationState,
	toggleFavoriteAction,
} from "@/app/(app)/foods/[foodId]/actions";
import {CustomFoodForm} from "@/components/foods/custom-food-form";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
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
import {Button, buttonVariants} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from "@/components/ui/card";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,} from "@/components/ui/sheet";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Spinner} from "@/components/ui/spinner";
import type {FoodDetailDto} from "@/lib/api/foods";
import {customFoodFormValuesFromFood} from "@/lib/foods/custom-food-draft";
import {customFoodPortionDraftsFrom} from "@/lib/foods/custom-food-portion-drafts";
import {cn} from "@/lib/utils";

const initialMutationState: FoodMutationState = {};

export function FoodFavoriteToggle({
	foodId,
	initialFavorite,
}: {
	foodId: string;
	initialFavorite: boolean;
}) {
	const [state, action] = useActionState(toggleFavoriteAction, {
		...initialMutationState,
		favorite: initialFavorite,
	});
	const favorite = state.favorite ?? initialFavorite;

	useFoodActionToast(state);

	return (
		<form action={action}>
			<input type="hidden" name="foodId" value={foodId} />
			<input type="hidden" name="favorite" value={String(!favorite)} />
			<FavoriteButton favorite={favorite} />
		</form>
	);
}

export function CustomFoodOwnerActions({ food }: { food: FoodDetailDto }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>مدیریت غذای سفارشی</CardTitle>
				<CardDescription>
					تغییرات فقط برای غذای ساخته‌شده توسط شما اعمال می‌شود.
				</CardDescription>
			</CardHeader>
		<CardContent className="flex flex-col gap-2">
				<CustomFoodEditDialog food={food} />
      <CustomFoodDuplicateSheet food={food}/>
				<CustomFoodArchiveDialog foodId={food.id} />
			</CardContent>
		</Card>
	);
}

function CustomFoodDuplicateSheet({food}: { food: FoodDetailDto }) {
  const [open, setOpen] = useState(false);
  return <Sheet open={open} onOpenChange={setOpen}>
    <SheetTrigger className={cn(buttonVariants({variant: "outline", size: "lg"}), "h-11 w-full rounded-full")}>
      <CopyIcon data-icon="inline-start"/>ساخت نسخه جدید
    </SheetTrigger>
    <SheetContent side="bottom" className="mx-auto w-full max-w-3xl p-4 sm:p-5" dir="rtl">
      <SheetHeader className="shrink-0 gap-1 pl-10">
        <SheetTitle>نسخه جدید غذای سفارشی</SheetTitle>
        <SheetDescription>نام را تغییر دهید؛ نسخه جدید مستقل است و غذای اصلی تغییر نمی‌کند.</SheetDescription>
      </SheetHeader>
      <ScrollArea className="flex min-h-0 flex-1" viewportClassName="flex min-h-0 flex-1 flex-col pb-2 pe-1">
        <CustomFoodForm initialValues={customFoodFormValuesFromFood(food, `کپی ${food.displayName}`)}
                        initialPortions={customFoodPortionDraftsFrom(food.portions)} submitLabel="ساخت نسخه جدید"
                        nextPath="/foods/custom" onSaved={() => setOpen(false)}/>
      </ScrollArea>
    </SheetContent>
  </Sheet>;
}

function CustomFoodEditDialog({ food }: { food: FoodDetailDto }) {
  const [open, setOpen] = useState(false);

	return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
				className={cn(
					buttonVariants({ variant: "outline", size: "lg" }),
					"h-11 w-full rounded-full",
				)}
			>
				<EditIcon data-icon="inline-start" />
				ویرایش غذا
      </SheetTrigger>
      <SheetContent side="bottom"
                    className="mx-auto w-full max-w-3xl p-4 sm:p-5"
                    dir="rtl">
        <SheetHeader className="shrink-0 gap-1 pl-10">
          <SheetTitle>ویرایش غذای سفارشی</SheetTitle>
          <SheetDescription>
						مقادیر غذایی را برای هر سروینگ به‌روزرسانی کنید.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex min-h-0 flex-1" viewportClassName="flex min-h-0 flex-1 flex-col pb-2 pe-1">
          <CustomFoodForm
            mode="edit"
            foodId={food.id}
            initialValues={customFoodFormValuesFromFood(food)}
            initialPortions={customFoodPortionDraftsFrom(food.portions)}
            submitLabel="ذخیره تغییرات"
            nextPath={`/foods/${encodeURIComponent(food.id)}`}
            onSaved={() => setOpen(false)}
          />
        </ScrollArea>
      </SheetContent>
    </Sheet>
	);
}

function CustomFoodArchiveDialog({ foodId }: { foodId: string }) {
	const [state, action] = useActionState(
		archiveCustomFoodAction,
		initialMutationState,
	);

	useFoodActionToast(state);

	return (
		<AlertDialog>
			<AlertDialogTrigger
				className={cn(
					buttonVariants({ variant: "destructive", size: "lg" }),
					"h-11 w-full rounded-full",
				)}
			>
				<ArchiveIcon data-icon="inline-start" />
				آرشیو غذا
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>آرشیو این غذا؟</AlertDialogTitle>
					<AlertDialogDescription>
						بعد از آرشیو، غذا از جستجوی عادی حذف می‌شود ولی ثبت‌های قدیمی خواندنی می‌مانند.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<form action={action} className="flex flex-col gap-3">
					<input type="hidden" name="foodId" value={foodId} />
					<input type="hidden" name="confirmArchive" value="true" />
					<MutationStatusAlert
						successMessage={state.successMessage}
						errorMessage={state.message}
						requestId={state.requestId}
						errorCount={0}
					/>
					<AlertDialogFooter>
						<AlertDialogCancel type="button" className="h-11 rounded-full">
							انصراف
						</AlertDialogCancel>
						<ArchiveButton />
					</AlertDialogFooter>
				</form>
			</AlertDialogContent>
		</AlertDialog>
	);
}

function FavoriteButton({ favorite }: { favorite: boolean }) {
	const { pending } = useFormStatus();

	return (
		<Button
			type="submit"
			variant={favorite ? "secondary" : "outline"}
			size="lg"
			className="h-11 rounded-full"
			disabled={pending}
		>
			{pending ? (
				<Spinner data-icon="inline-start" />
			) : (
				<HeartIcon data-icon="inline-start" className={favorite ? "fill-current" : undefined} />
			)}
			{pending
				? "در حال ذخیره..."
				: favorite
					? "حذف از علاقه‌مندی"
					: "افزودن به علاقه‌مندی"}
		</Button>
	);
}

function ArchiveButton({ disabled = false }: { disabled?: boolean }) {
	const { pending } = useFormStatus();

	return (
		<Button
			type="submit"
			variant="destructive"
			size="lg"
			className="h-11 rounded-full"
			disabled={disabled || pending}
		>
			{pending ? (
				<Spinner data-icon="inline-start" />
			) : (
				<ArchiveIcon data-icon="inline-start" />
			)}
			{pending ? "در حال آرشیو..." : "آرشیو غذا"}
		</Button>
	);
}

function MutationStatusAlert({
	successMessage,
	errorMessage,
	requestId,
	errorCount,
}: {
	successMessage?: string;
	errorMessage?: string;
	requestId?: string;
	errorCount: number;
}) {
	if (successMessage) {
		return (
			<Alert>
				<CheckCircle2Icon />
				<AlertTitle>ذخیره شد</AlertTitle>
				<AlertDescription>{successMessage}</AlertDescription>
			</Alert>
		);
	}

	if (!errorMessage) return null;

	return (
		<Alert variant="destructive">
			<AlertCircleIcon />
			<AlertTitle>
				{errorCount > 0 ? "فرم نیاز به اصلاح دارد" : "پاسخ سرور ناموفق بود"}
			</AlertTitle>
			<AlertDescription>
				{errorMessage}
				{errorCount > 0 ? (
					<span> {errorCount.toLocaleString("fa-IR")} فیلد را بررسی کنید.</span>
				) : null}
				{requestId ? (
					<span className="mt-1 block font-mono text-xs" dir="ltr">
						requestId: {requestId}
					</span>
				) : null}
			</AlertDescription>
		</Alert>
	);
}

function useFoodActionToast(state: FoodMutationState) {
	const toastKey = useMemo(
		() => state.successMessage ?? state.message,
		[state.message, state.successMessage],
	);

	useEffect(() => {
		if (!toastKey) return;

		if (state.successMessage) {
			toast.success(state.successMessage);
		} else if (state.message) {
			toast.error(state.message);
		}
	}, [state.message, state.successMessage, toastKey]);
}
