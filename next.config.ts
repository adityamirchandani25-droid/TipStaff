import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Three 4 MB photos expand to about 16 MB when encoded as data URLs.
  experimental: { serverActions: { bodySizeLimit: "20mb" } },
  // Pin the workspace root explicitly — otherwise Turbopack's root
  // inference can pick up an unrelated lockfile elsewhere on disk.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
