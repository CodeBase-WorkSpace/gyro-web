import type { MetadataRoute } from "next";

import { getDictionary } from "@/lib/i18n/dictionaries";
import { appShellLocale, localeDefinitionFor } from "@/lib/i18n/config";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
	const localeDefinition = localeDefinitionFor(appShellLocale);
	const dictionary = await getDictionary(appShellLocale);

	return {
		name: "Gyro",
		short_name: "Gyro",
		// short_name: dictionary.pwa.shortName,
		description: dictionary.pwa.description,
		id: "/",
		start_url: "/auth/login",
		scope: "/",
		display: "standalone",
		display_override: ["standalone", "minimal-ui"],
		background_color: "#0d1513",
		theme_color: "#0d1513",
		dir: localeDefinition.dir,
		lang: localeDefinition.htmlLang,
		orientation: "portrait",
		categories: ["health", "fitness", "food"],
		icons: [
			{
				src: "/icons/pwa/icon-192.png",
				sizes: "192x192",
				type: "image/png",
				purpose: "any",
			},
			{
				src: "/icons/pwa/icon-512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "any",
			},
			{
				src: "/icons/pwa/maskable-192.png",
				sizes: "192x192",
				type: "image/png",
				purpose: "maskable",
			},
			{
				src: "/icons/pwa/maskable-512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable",
			},
		],
	};
}
