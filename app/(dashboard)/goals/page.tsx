import { createClient } from "@/lib/supabase/server";
import { getUserOrDemo } from "@/lib/auth/getUser";
import { GoalsClient } from "@/components/goals/GoalsClient";

export default async function GoalsPage() {
  const { user, isDemo } = await getUserOrDemo();

  if (isDemo) {
    return (
      <div className="p-4 md:p-6 animate-fade-in">
        <GoalsClient initialGoals={[]} userId={user.id} />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: goals } = await supabase.from("goals").select("*").eq("user_id", user.id).order("created_at", { ascending: false });

  return (
    <div className="p-4 md:p-6 animate-fade-in">
      <GoalsClient initialGoals={goals ?? []} userId={user.id} />
    </div>
  );
}
