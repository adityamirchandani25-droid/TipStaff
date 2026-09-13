export type AccountPortal = "CUSTOMER" | "PROVIDER" | "COMPANY";

export function accountHome(role?: string) {
  if (role === "PROVIDER") return "/worker/dashboard";
  if (role === "COMPANY") return "/company/dashboard";
  return "/dashboard";
}

export function safeCustomerCallback(raw: unknown) {
  if (typeof raw !== "string" || /[\\\u0000-\u0020]/.test(raw)) return "/dashboard";
  try {
    const url = new URL(raw, "https://fixitfast.local");
    if (url.origin !== "https://fixitfast.local") return "/dashboard";
    if (!(url.pathname === "/dashboard" || url.pathname.startsWith("/request/"))) return "/dashboard";
    return `${url.pathname}${url.search}`;
  } catch {
    return "/dashboard";
  }
}

export function safeAuthCallback(raw: unknown, fallback = "/dashboard") {
  if (typeof raw !== "string" || /[\\\u0000-\u0020]/.test(raw)) return fallback;
  try {
    const url = new URL(raw, "https://fixitfast.local");
    if (url.origin !== "https://fixitfast.local") return fallback;
    const allowed =
      url.pathname === "/dashboard" ||
      url.pathname.startsWith("/request/") ||
      url.pathname === "/update-password" ||
      url.pathname === "/worker/dashboard" ||
      url.pathname === "/company/dashboard";
    return allowed ? `${url.pathname}${url.search}` : fallback;
  } catch {
    return fallback;
  }
}
