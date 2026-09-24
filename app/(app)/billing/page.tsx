import {redirect} from "next/navigation";

export default function BillingRedirectPage({searchParams}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = new URLSearchParams();
  const sp = searchParams as Promise<Record<string, string | string[] | undefined>>;
  return (async () => {
    const resolved = await sp;
    for (const [key, value] of Object.entries(resolved)) {
      if (typeof value === "string") {
        params.set(key, value);
      }
    }
    const query = params.toString();
    redirect(`/profile/billing${query ? `?${query}` : ""}`);
  })();
}
