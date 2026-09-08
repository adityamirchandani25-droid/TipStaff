export type AccountPortal = "CUSTOMER" | "PROVIDER";

export function accountHome(role?: string) {
  return role === "PROVIDER" ? "/worker/dashboard" : "/dashboard";
}

export function safeCustomerCallback(raw: unknown) {
  if (typeof raw !== "string" || /[\\\u0000-\u0020]/.test(raw)) return "/dashboard";
  try {
    const url = new URL(raw, "https://tipstaff.local");
    if (url.origin !== "https://tipstaff.local") return "/dashboard";
    if (!(url.pathname === "/dashboard" || url.pathname.startsWith("/request/"))) return "/dashboard";
    return `${url.pathname}${url.search}`;
  } catch {
    return "/dashboard";
  }
}

export function safeAuthCallback(raw: unknown, fallback = "/dashboard") {
  if (typeof raw !== "string" || /[\\\u0000-\u0020]/.test(raw)) return fallback;
  try {
    const url = new URL(raw, "https://tipstaff.local");
    if (url.origin !== "https://tipstaff.local") return fallback;
    const allowed =
      url.pathname === "/dashboard" ||
      url.pathname.startsWith("/request/") ||
      url.pathname === "/worker/dashboard";
    return allowed ? `${url.pathname}${url.search}` : fallback;
  } catch {
    return fallback;
  }
}
