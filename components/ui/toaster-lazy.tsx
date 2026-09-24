"use client";

import dynamic from "next/dynamic";

import type {LocaleDirection} from "@/lib/i18n/config";

// sonner plus its icons is ~37 KB that every route — marketing pages included —
// used to parse as part of the server-rendered shared bundle, before hydration
// could start.
//
// This does not defer the fetch until someone triggers a toast: next/dynamic
// renders immediately, so the chunk starts loading as this component hydrates.
// What it buys is ordering — the chunk leaves the initial script payload and is
// parsed off the critical path, so root hydration has less work in front of it.
//
// `ssr: false` means the toaster is skipped during server rendering and client
// rendered instead. Next contains that bailout to this component on its own, so
// the surrounding route still server renders normally; verified by diffing the
// prerendered HTML with and without this component.
const Toaster = dynamic(
	() => import("./sonner").then((module) => module.Toaster),
	{ssr: false},
);

export function ToasterLazy({dir}: {dir: LocaleDirection}) {
	return (
		<Toaster
			closeButton
			richColors
			position="top-center"
			dir={dir}
			offset={{
				top: "calc(var(--pwa-safe-top, env(safe-area-inset-top, 0px)) + 24px)",
				bottom: "calc(var(--pwa-safe-bottom, env(safe-area-inset-bottom, 0px)) + 16px)",
			}}
			mobileOffset={{
				top: "calc(var(--pwa-safe-top, env(safe-area-inset-top, 0px)) + 28px)",
				right: "16px",
				bottom: "calc(var(--pwa-safe-bottom, env(safe-area-inset-bottom, 0px)) + 16px)",
				left: "16px",
			}}
		/>
	);
}
