"use client";

import {Trash2Icon} from "lucide-react";
import {startTransition, useState} from "react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";

import {deleteDiaryEntryAction} from "@/app/_actions/quick-add";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {Spinner} from "@/components/ui/spinner";
import type {DiaryEntrySummary} from "@/lib/api/diary";

export function DiaryEntryDeleteControl({
	date,
	dateLabel,
	entry,
	disabled = false,
}: {
	date: string;
	dateLabel: string;
	entry: DiaryEntrySummary;
	disabled?: boolean;
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [intentId, setIntentId] = useState(() => createDeleteIntentId());

	async function confirmDelete() {
		setDeleting(true);
		setMessage(null);
		const result = await deleteDiaryEntryAction({
			date,
			entryId: entry.id,
			idempotencyKey: intentId,
			nextPath: `/foods?date=${date}`,
		});
		if (!result.ok) {
			setDeleting(false);
			setMessage(result.message);
			toast.error(result.message);
			return;
		}
		setDeleting(false);
		setOpen(false);
		toast.success(`«${entry.displayName}» از دفتر غذایی حذف شد.`);
		startTransition(() => router.refresh());
	}

	return (
		<AlertDialog open={open} onOpenChange={(nextOpen) => {
			if (!deleting) setOpen(nextOpen);
		}}>
			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				className="text-muted-foreground hover:text-destructive"
				aria-label={`حذف ${entry.displayName}`}
				disabled={deleting || disabled}
				title={disabled ? "این تاریخ فقط برای مشاهده است." : undefined}
				onClick={() => {
					setMessage(null);
					setIntentId(createDeleteIntentId());
					setOpen(true);
				}}
			>
				<Trash2Icon />
			</Button>
			<AlertDialogContent dir="rtl" className="text-right">
				<AlertDialogHeader>
					<AlertDialogTitle>حذف ثبت غذایی؟</AlertDialogTitle>
					<AlertDialogDescription>
						«{entry.displayName}» از دفتر غذایی {dateLabel} حذف می‌شود. این عمل قابل بازگشت نیست.
					</AlertDialogDescription>
				</AlertDialogHeader>
				{message ? (
					<Alert variant="destructive">
						<AlertTitle>حذف انجام نشد</AlertTitle>
						<AlertDescription>{message}</AlertDescription>
					</Alert>
				) : null}
				<AlertDialogFooter>
					<AlertDialogCancel disabled={deleting}>انصراف</AlertDialogCancel>
					<Button type="button" variant="destructive" disabled={deleting} onClick={confirmDelete}>
						{deleting ? <><Spinner /> در حال حذف</> : "حذف ثبت"}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

function createDeleteIntentId() {
	return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `diary-delete-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
