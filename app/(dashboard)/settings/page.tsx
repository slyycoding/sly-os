import { createClient } from "@/lib/supabase/server";
import { getUserOrDemo, DEMO_PROFILE } from "@/lib/auth/getUser";
import { SettingsClient } from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  const { user, isDemo } = await getUserOrDemo();

  if (isDemo) {
    return (
      <div className="p-4 md:p-6 animate-fade-in">
        <SettingsClient profile={DEMO_PROFILE as any} userId={user.id} />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return (
    <div className="p-4 md:p-6 animate-fade-in">
      <SettingsClient profile={profile} userId={user.id} />
    </div>
  );
}
