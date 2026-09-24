import {publicSitemapXml} from "@/lib/seo/sitemap";

export function GET() {
  return new Response(publicSitemapXml(), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
