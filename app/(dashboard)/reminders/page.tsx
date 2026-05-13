import { createClient } from "@/lib/supabase/server";
import { getUserOrDemo } from "@/lib/auth/getUser";
import { RemindersClient } from "@/components/reminders/RemindersClient";

export default async function RemindersPage() {
  const { user, isDemo } = await getUserOrDemo();

  if (isDemo) {
    return (
      <div className="p-4 md:p-6 animate-fade-in">
        <RemindersClient initialReminders={[]} userId={user.id} />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: reminders } = await supabase.from("reminders").select("*").eq("user_id", user.id).order("due_date").order("due_time");

  return (
    <div className="p-4 md:p-6 animate-fade-in">
      <RemindersClient initialReminders={reminders ?? []} userId={user.id} />
    </div>
  );
}
