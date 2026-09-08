import type { NextAuthConfig } from "next-auth";

const PROTECTED_PREFIXES = ["/dashboard", "/request"];

// Edge-safe base config (no providers, no Prisma) — this is what
// middleware runs. The full config with the Credentials provider (which
// needs bcrypt + Prisma, both Node-only) lives in auth.ts and extends
// this one for route handlers and server components.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const path = nextUrl.pathname;
      const workerRoute = path === "/worker/dashboard" || path.startsWith("/worker/dashboard/");
      const customerRoute = PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
      if (!workerRoute && !customerRoute) return true;
      if (!auth?.user) {
        const login = new URL(workerRoute ? "/worker/login" : "/login", nextUrl);
        if (customerRoute) login.searchParams.set("callbackUrl", `${path}${nextUrl.search}`);
        return Response.redirect(login);
      }
      if (workerRoute && auth.user.role !== "PROVIDER") return Response.redirect(new URL("/dashboard", nextUrl));
      if (customerRoute && auth.user.role === "PROVIDER") return Response.redirect(new URL("/worker/dashboard", nextUrl));
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
