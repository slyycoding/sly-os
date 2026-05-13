import { createClient } from "@/lib/supabase/server";
import { getUserOrDemo } from "@/lib/auth/getUser";
import { LearningClient } from "@/components/learning/LearningClient";

export default async function LearningPage() {
  const { user, isDemo } = await getUserOrDemo();

  if (isDemo) {
    return (
      <div className="p-4 md:p-6 animate-fade-in">
        <LearningClient initialPaths={[]} initialTopics={[]} initialResources={[]} initialSessions={[]} initialCertificates={[]} userId={user.id} />
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: paths }, { data: topics }, { data: resources }, { data: sessions }, { data: certificates }] = await Promise.all([
    supabase.from("learning_paths").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("learning_topics").select("*").eq("user_id", user.id).order("order_index"),
    supabase.from("learning_resources").select("*").eq("user_id", user.id),
    supabase.from("study_sessions").select("*").eq("user_id", user.id).order("start_time", { ascending: false }).limit(20),
    supabase.from("certificates").select("*").eq("user_id", user.id),
  ]);

  return (
    <div className="p-4 md:p-6 animate-fade-in">
      <LearningClient initialPaths={paths ?? []} initialTopics={topics ?? []} initialResources={resources ?? []} initialSessions={sessions ?? []} initialCertificates={certificates ?? []} userId={user.id} />
    </div>
  );
}
