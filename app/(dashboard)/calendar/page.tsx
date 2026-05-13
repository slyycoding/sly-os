import { createClient } from "@/lib/supabase/server";
import { getUserOrDemo } from "@/lib/auth/getUser";
import { CalendarClient } from "@/components/calendar/CalendarClient";

export default async function CalendarPage() {
  const { user, isDemo } = await getUserOrDemo();

  if (isDemo) {
    return (
      <div className="p-4 md:p-6 animate-fade-in">
        <CalendarClient initialEvents={[]} tasks={[]} userId={user.id} />
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: events }, { data: tasks }] = await Promise.all([
    supabase.from("calendar_events").select("*").eq("user_id", user.id).order("start_date"),
    supabase.from("tasks").select("id, title, due_date, status, priority").eq("user_id", user.id).not("due_date", "is", null),
  ]);

  return (
    <div className="p-4 md:p-6 animate-fade-in">
      <CalendarClient initialEvents={events ?? []} tasks={tasks ?? []} userId={user.id} />
    </div>
  );
}
