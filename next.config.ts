import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true"
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"]
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {key: "Cache-Control", value: "no-store, max-age=0"},
          {key: "Service-Worker-Allowed", value: "/"}
        ]
      },
      {
        source: "/pwa-recovery.html",
        headers: [{key: "Cache-Control", value: "no-store, max-age=0"}]
      },
      {
        // Font files are content-stable; rename the file when the font changes.
        source: "/fonts/:path*",
        headers: [
          {key: "Cache-Control", value: "public, max-age=31536000, immutable"}
        ]
      }
    ];
  }
};

export default withBundleAnalyzer(nextConfig);
