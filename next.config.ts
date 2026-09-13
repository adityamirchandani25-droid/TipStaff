import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Three 4 MB photos expand to about 16 MB when encoded as data URLs.
  experimental: { serverActions: { bodySizeLimit: "20mb" } },
  // Pin the workspace root explicitly — otherwise Turbopack's root
  // inference can pick up an unrelated lockfile elsewhere on disk.
  turbopack: {
    root: path.resolve(__dirname),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: 'camera=(), microphone=(), geolocation=(self), payment=(self "https://js.stripe.com")' },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
    ];
  },
};

export default nextConfig;
