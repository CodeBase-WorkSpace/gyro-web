import Link from "next/link";
import Image from "next/image";
import { ChevronLeftIcon } from "lucide-react";

import { BrandMark } from "@/components/design-system/brand-mark";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AuthShellProps = {
	eyebrow: string;
	title: string;
	description: string;
	children: React.ReactNode;
	footerLabel: string;
	footerHref: string;
	footerAction: string;
};

export function AuthShell({
	eyebrow,
	title,
	description,
	children,
	footerLabel,
	footerHref,
	footerAction,
}: AuthShellProps) {
	return (
		<main className="min-h-dvh bg-background text-foreground px-8">
			<section className="flex min-h-[calc(100dvh-40px)] items-center justify-center py-6">
				<div className="flex w-full max-w-md flex-col gap-5">
					<BrandMark sublabel="حساب کاربری" />
					<Card className="animate-[auth-panel-in_280ms_ease-out] rounded-[24px] border border-border bg-card shadow-none">
						<CardHeader className="gap-2 px-5 pt-5">
							<p className="text-sm font-bold text-primary">
								{eyebrow}
							</p>
							<CardTitle className="font-heading text-2xl font-bold tracking-normal">
								{title}
							</CardTitle>
							<CardDescription className="leading-7">
								{description}
							</CardDescription>
						</CardHeader>
						<CardContent className="px-5 pb-5">
							{children}
						</CardContent>
						<CardFooter className={"w-full justify-between"}>
							<span>{footerLabel}</span>
							<Link
								href={footerHref}
								className={cn(
									buttonVariants({
										variant: "ghost",
										size: "sm",
									}),
									"rounded-full text-primary",
								)}
							>
								{footerAction}
								<ChevronLeftIcon data-icon="inline-end" />
							</Link>
						</CardFooter>
					</Card>
				</div>
			</section>
		</main>
	);
}
