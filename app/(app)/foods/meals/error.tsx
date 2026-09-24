"use client";

import { AlertCircleIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function MealsError({ reset }: { error: Error; reset: () => void }) {
	return (
		<main id="main-content" className="mx-auto flex min-h-svh w-full max-w-3xl items-center px-4 py-8">
			<Alert variant="destructive">
				<AlertCircleIcon aria-hidden="true" />
				<AlertTitle>کتابخانه وعده‌ها در دسترس نیست</AlertTitle>
				<AlertDescription className="flex flex-col gap-3">
					<span>دریافت وعده‌های سفارشی ناموفق بود. اطلاعات جستجو در نشانی صفحه حفظ شده است.</span>
					<Button type="button" variant="outline" className="w-fit" onClick={reset}>تلاش دوباره</Button>
				</AlertDescription>
			</Alert>
		</main>
	);
}
