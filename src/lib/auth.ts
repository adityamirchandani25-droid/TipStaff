import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Role } from "@/generated/prisma/enums";

export interface AppSession {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: Role;
  };
}

export async function auth(): Promise<AppSession | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getClaims();
    const authUserId = data?.claims?.sub;
    if (error || typeof authUserId !== "string") return null;

    const user = await prisma.user.findUnique({
      where: { id: authUserId },
      select: { id: true, name: true, email: true, image: true, role: true },
    });
    return user ? { user } : null;
  } catch {
    return null;
  }
}
