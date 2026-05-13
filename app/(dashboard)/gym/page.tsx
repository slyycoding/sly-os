import { createClient } from "@/lib/supabase/server";
import { getUserOrDemo } from "@/lib/auth/getUser";
import { GymClient } from "@/components/gym/GymClient";

export default async function GymPage() {
  const { user, isDemo } = await getUserOrDemo();

  if (isDemo) {
    return (
      <div className="p-4 md:p-6 animate-fade-in">
        <GymClient initialLogs={[]} initialExercises={[]} userId={user.id} />
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: logs }, { data: exercises }] = await Promise.all([
    supabase.from("gym_logs").select("*").eq("user_id", user.id).order("workout_date", { ascending: false }).limit(30),
    supabase.from("exercises").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  return (
    <div className="p-4 md:p-6 animate-fade-in">
      <GymClient initialLogs={logs ?? []} initialExercises={exercises ?? []} userId={user.id} />
    </div>
  );
}
