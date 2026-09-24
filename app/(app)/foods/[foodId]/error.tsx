"use client";

import { AlertCircleIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function FoodDetailError({ reset }: { error: Error; reset: () => void }) {
	return (
		<main id="main-content" className="mx-auto flex min-h-svh w-full max-w-3xl items-center px-4 py-8">
			<Alert variant="destructive">
				<AlertCircleIcon />
				<AlertTitle>جزئیات غذا در دسترس نیست</AlertTitle>
				<AlertDescription className="flex flex-col gap-3">
					<span>دریافت اطلاعات غذا ناموفق بود. پس از بازگشت اتصال دوباره تلاش کنید.</span>
					<Button type="button" variant="outline" className="w-fit" onClick={reset}>تلاش دوباره</Button>
				</AlertDescription>
			</Alert>
		</main>
	);
}
