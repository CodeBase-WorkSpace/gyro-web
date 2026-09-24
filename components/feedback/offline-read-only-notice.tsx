"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Mounted on every route, but the banner renders for a tiny fraction of
// sessions. Only the connection listener belongs in the shared baseline; the
// Alert markup loads when the connection actually drops.
const OfflineBanner = dynamic(
	() => import("./offline-banner").then((module) => module.OfflineBanner),
	{ ssr: false },
);

export function OfflineReadOnlyNotice() {
	const [isOffline, setIsOffline] = useState(false);

	useEffect(() => {
		const updateConnection = () => setIsOffline(!navigator.onLine);
		updateConnection();
		window.addEventListener("online", updateConnection);
		window.addEventListener("offline", updateConnection);
		return () => {
			window.removeEventListener("online", updateConnection);
			window.removeEventListener("offline", updateConnection);
		};
	}, []);

	if (!isOffline) return null;

	return <OfflineBanner />;
}
