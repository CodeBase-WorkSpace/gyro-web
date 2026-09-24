"use client";

import { ArchiveIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { archiveCustomMealAction } from "@/app/_actions/custom-meals";
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
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function MealArchiveControl({ mealId, mealName }: { mealId: string; mealName: string }) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isPending, startArchiveTransition] = useTransition();

	function archive() {
		setError(null);
		startArchiveTransition(async () => {
			const result = await archiveCustomMealAction({
				mealId,
				nextPath: `/foods/meals/${mealId}`,
			});
			if (!result.ok) {
				setError(result.message);
				toast.error(result.message);
				return;
			}
			toast.success(`وعده «${mealName}» بایگانی شد. ثبت‌های قدیمی دفتر غذایی بدون تغییر باقی ماندند.`);
			setOpen(false);
			router.push("/foods/meals");
			router.refresh();
		});
	}

	return (
		<AlertDialog open={open} onOpenChange={(nextOpen) => {
			if (!isPending) setOpen(nextOpen);
		}}>
			<AlertDialogTrigger render={<Button type="button" variant="destructive" />}>
				<ArchiveIcon data-icon="inline-start" />
				بایگانی
			</AlertDialogTrigger>
			<AlertDialogContent dir="rtl">
				<AlertDialogHeader>
					<AlertDialogTitle>بایگانی «{mealName}»؟</AlertDialogTitle>
					<AlertDialogDescription>
						این الگو از فهرست وعده‌های فعال حذف می‌شود، اما ثبت‌های قدیمی دفتر غذایی و مقادیر تغذیه‌ای آن‌ها باقی می‌مانند.
					</AlertDialogDescription>
				</AlertDialogHeader>
				{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending}>لغو</AlertDialogCancel>
					<Button type="button" variant="destructive" disabled={isPending} onClick={archive}>
						{isPending ? <Spinner data-icon="inline-start" /> : <ArchiveIcon data-icon="inline-start" />}
						{isPending ? "در حال بایگانی" : "تأیید بایگانی"}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
