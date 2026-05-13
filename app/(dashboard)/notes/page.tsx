import { createClient } from "@/lib/supabase/server";
import { getUserOrDemo } from "@/lib/auth/getUser";
import { NotesClient } from "@/components/notes/NotesClient";

export default async function NotesPage() {
  const { user, isDemo } = await getUserOrDemo();

  if (isDemo) {
    return (
      <div className="p-4 md:p-6 animate-fade-in">
        <NotesClient initialNotes={[]} projects={[]} userId={user.id} />
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: notes }, { data: projects }] = await Promise.all([
    supabase.from("notes").select("*").eq("user_id", user.id).order("is_pinned", { ascending: false }).order("updated_at", { ascending: false }),
    supabase.from("projects").select("id, name").eq("user_id", user.id),
  ]);

  return (
    <div className="p-4 md:p-6 animate-fade-in">
      <NotesClient initialNotes={notes ?? []} projects={projects ?? []} userId={user.id} />
    </div>
  );
}
