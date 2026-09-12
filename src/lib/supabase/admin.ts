import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";

/**
 * Service-role Supabase client. This bypasses RLS and can mint credentials
 * for other people (used by company account creation to set a worker's
 * initial password on their behalf) — only ever call this from server
 * actions/route handlers. SUPABASE_SERVICE_ROLE_KEY has no NEXT_PUBLIC_
 * prefix, so Next.js already won't inline it into a client bundle even if
 * this got imported from one — but treat that as a backstop, not a plan.
 */
export function createSupabaseAdminClient() {
  const { url } = getSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Required for company-managed worker accounts.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
