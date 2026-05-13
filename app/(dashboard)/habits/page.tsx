import { createClient } from "@/lib/supabase/server";
import { getUserOrDemo } from "@/lib/auth/getUser";
import { HabitsClient } from "@/components/habits/HabitsClient";

export default async function HabitsPage() {
  const { user, isDemo } = await getUserOrDemo();

  if (isDemo) {
    return (
      <div className="p-4 md:p-6 animate-fade-in">
        <HabitsClient initialHabits={[]} initialLogs={[]} userId={user.id} />
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: habits }, { data: logs }] = await Promise.all([
    supabase.from("habits").select("*").eq("user_id", user.id).eq("is_active", true).order("created_at"),
    supabase.from("habit_logs").select("*").eq("user_id", user.id).gte("log_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]),
  ]);

  return (
    <div className="p-4 md:p-6 animate-fade-in">
      <HabitsClient initialHabits={habits ?? []} initialLogs={logs ?? []} userId={user.id} />
    </div>
  );
}
