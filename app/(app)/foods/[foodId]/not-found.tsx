import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

export default function FoodNotFound() {
	return (
		<main id="main-content" className="mx-auto grid min-h-svh w-full max-w-3xl place-items-center px-4 py-8">
			<Empty>
				<EmptyHeader>
					<EmptyTitle>غذا در دسترس نیست</EmptyTitle>
					<EmptyDescription>ممکن است غذا آرشیو شده باشد یا دیگر اجازه دسترسی به آن را نداشته باشید.</EmptyDescription>
				</EmptyHeader>
				<Button render={<Link href="/foods" />}>بازگشت به غذاها</Button>
			</Empty>
		</main>
	);
}
