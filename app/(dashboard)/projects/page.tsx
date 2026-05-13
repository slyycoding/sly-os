import { createClient } from "@/lib/supabase/server";
import { getUserOrDemo } from "@/lib/auth/getUser";
import { ProjectsClient } from "@/components/projects/ProjectsClient";

export default async function ProjectsPage() {
  const { user, isDemo } = await getUserOrDemo();

  if (isDemo) {
    return (
      <div className="p-4 md:p-6 animate-fade-in">
        <ProjectsClient initialProjects={[]} milestones={[]} logs={[]} userId={user.id} />
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: projects }, { data: milestones }, { data: logs }] = await Promise.all([
    supabase.from("projects").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("project_milestones").select("*").eq("user_id", user.id),
    supabase.from("project_logs").select("*").eq("user_id", user.id).order("log_date", { ascending: false }),
  ]);

  return (
    <div className="p-4 md:p-6 animate-fade-in">
      <ProjectsClient initialProjects={projects ?? []} milestones={milestones ?? []} logs={logs ?? []} userId={user.id} />
    </div>
  );
}
