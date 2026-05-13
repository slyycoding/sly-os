import { createClient } from "@/lib/supabase/server";
import { getUserOrDemo } from "@/lib/auth/getUser";
import { SkincareClient } from "@/components/skincare/SkincareClient";

export default async function SkincarePage() {
  const { user, isDemo } = await getUserOrDemo();

  if (isDemo) {
    return (
      <div className="p-4 md:p-6 animate-fade-in">
        <SkincareClient initialLogs={[]} userId={user.id} />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: logs } = await supabase.from("skincare_logs").select("*").eq("user_id", user.id).order("log_date", { ascending: false }).limit(60);

  return (
    <div className="p-4 md:p-6 animate-fade-in">
      <SkincareClient initialLogs={logs ?? []} userId={user.id} />
    </div>
  );
}
