import { createClient } from "@/lib/supabase/server";
import { getUserOrDemo } from "@/lib/auth/getUser";
import { TasksClient } from "@/components/tasks/TasksClient";

export default async function TasksPage() {
  const { user, isDemo } = await getUserOrDemo();

  if (isDemo) {
    return (
      <div className="p-4 md:p-6 animate-fade-in">
        <TasksClient initialTasks={[]} projects={[]} userId={user.id} />
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: tasks }, { data: projects }] = await Promise.all([
    supabase.from("tasks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("projects").select("id, name").eq("user_id", user.id).eq("status", "active"),
  ]);

  return (
    <div className="p-4 md:p-6 animate-fade-in">
      <TasksClient initialTasks={tasks ?? []} projects={projects ?? []} userId={user.id} />
    </div>
  );
}
