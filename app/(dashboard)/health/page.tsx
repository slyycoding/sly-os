import { createClient } from "@/lib/supabase/server";
import { getUserOrDemo } from "@/lib/auth/getUser";
import { HealthClient } from "@/components/health/HealthClient";

export default async function HealthPage() {
  const { user, isDemo } = await getUserOrDemo();

  if (isDemo) {
    return (
      <div className="p-4 md:p-6 animate-fade-in">
        <HealthClient initialLogs={[]} userId={user.id} />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: logs } = await supabase.from("health_logs").select("*").eq("user_id", user.id).order("log_date", { ascending: false }).limit(30);

  return (
    <div className="p-4 md:p-6 animate-fade-in">
      <HealthClient initialLogs={logs ?? []} userId={user.id} />
    </div>
  );
}
