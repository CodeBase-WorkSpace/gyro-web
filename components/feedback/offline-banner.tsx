"use client";

import { WifiOffIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * The visible half of the offline notice. Split from the connection listener so
 * the Alert primitive and its icon stay out of the shared baseline until the
 * connection actually drops.
 */
export function OfflineBanner() {
	return (
		<div className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-lg" dir="rtl" role="status">
			<Alert variant="destructive" className="border-destructive/40 bg-background shadow-xl">
				<WifiOffIcon aria-hidden="true" />
				<AlertTitle>آفلاین هستید؛ حالت فقط‌خواندنی فعال است</AlertTitle>
				<AlertDescription>
					تا بازگشت اتصال، اطلاعات تازه نمی‌شوند و ثبت یا ویرایش ذخیره نخواهد شد. این برنامه هنوز ذخیره آفلاین ندارد.
				</AlertDescription>
			</Alert>
		</div>
	);
}
