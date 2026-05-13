import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export const DEMO_USER_ID = "demo-00000000-0000-0000-0000";

export const DEMO_USER = {
  id: DEMO_USER_ID,
  email: "demo@slyos.app",
  user_metadata: { full_name: "Sly" },
  app_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as unknown as User;

export const DEMO_PROFILE = {
  id: DEMO_USER_ID,
  email: "demo@slyos.app",
  full_name: "Sly",
  avatar_url: null,
  timezone: "Australia/Sydney",
  theme: "dark",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export async function isDemoMode(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("sly-demo")?.value === "true";
}

export async function getUserOrDemo(): Promise<{ user: User; isDemo: boolean }> {
  const demo = await isDemoMode();
  if (demo) return { user: DEMO_USER, isDemo: true };

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    return { user: user!, isDemo: false };
  } catch {
    redirect("/login");
  }
}
