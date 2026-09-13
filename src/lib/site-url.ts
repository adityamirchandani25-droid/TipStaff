export function getSiteUrl() {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL;
  const value = configured?.trim().replace(/\/$/, "") || "https://fixitfast.com";
  return value.startsWith("http://") || value.startsWith("https://")
    ? value
    : `https://${value}`;
}
