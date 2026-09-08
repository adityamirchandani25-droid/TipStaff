import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeAuthCallback } from "@/lib/auth-routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const code = request.nextUrl.searchParams.get("code");
  const next = safeAuthCallback(
    request.nextUrl.searchParams.get("next"),
    "/dashboard",
  );
  const supabase = await createSupabaseServerClient();

  const result = tokenHash && type
    ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    : code
      ? await supabase.auth.exchangeCodeForSession(code)
      : { error: new Error("Missing confirmation token") };

  const destination = result.error ? "/login?error=confirmation" : next;
  return NextResponse.redirect(new URL(destination, request.url));
}
