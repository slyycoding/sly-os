import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserOrDemo, DEMO_PROFILE } from "@/lib/auth/getUser";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DashboardQuickAdd } from "@/components/dashboard/DashboardQuickAdd";
import {
  CheckSquare, FolderKanban, Target, Dumbbell, Sparkles,
  Wallet, Activity, GraduationCap, Bell, ArrowRight, Flame, AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, getPriorityColor } from "@/lib/utils";

export default async function DashboardPage() {
  const { user, isDemo } = await getUserOrDemo();
  const today = new Date().toISOString().split("T")[0];

  // Demo mode — render dashboard with empty data
  if (isDemo) {
    return <DashboardShell userId={user.id} profile={DEMO_PROFILE as any} today={today}
      todayTasks={[]} activeProjects={[]} todayHabits={[]} habitLogs={[]}
      todayGym={null} todaySkincare={[]} monthlySpend={0}
      upcomingReminders={[]} activeGoals={[]} learningPaths={[]} />;
  }

  const supabase = await createClient();

  const [
    { data: todayTasks }, { data: activeProjects }, { data: todayHabits },
    { data: habitLogs }, { data: todayGym }, { data: todaySkincare },
    { data: recentExpenses }, { data: upcomingReminders }, { data: activeGoals },
    { data: learningPaths }, { data: profile },
  ] = await Promise.all([
    // Tasks: show today's + overdue (not done) so nothing gets lost
    supabase.from("tasks").select("*").eq("user_id", user.id)
      .or(`due_date.eq.${today},and(due_date.lt.${today},status.neq.done)`)
      .order("due_date", { ascending: false }).order("priority", { ascending: false }).limit(10),
    // Projects: show all except cancelled so planning projects appear too
    supabase.from("projects").select("*").eq("user_id", user.id)
      .neq("status", "cancelled").order("created_at", { ascending: false }).limit(4),
    supabase.from("habits").select("*").eq("user_id", user.id).eq("is_active", true),
    supabase.from("habit_logs").select("*").eq("user_id", user.id).eq("log_date", today),
    supabase.from("gym_logs").select("*").eq("user_id", user.id).eq("workout_date", today).maybeSingle(),
    supabase.from("skincare_logs").select("*").eq("user_id", user.id).eq("log_date", today),
    supabase.from("expenses").select("amount").eq("user_id", user.id).gte("expense_date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]),
    supabase.from("reminders").select("*").eq("user_id", user.id).eq("is_completed", false).gte("due_date", today).order("due_date").limit(5),
    // Goals: show all except abandoned so not_started goals appear too
    supabase.from("goals").select("*").eq("user_id", user.id)
      .neq("status", "abandoned").order("created_at", { ascending: false }).limit(4),
    supabase.from("learning_paths").select("*").eq("user_id", user.id).eq("is_active", true).limit(3),
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
  ]);

  const monthlySpend = recentExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;

  return <DashboardShell userId={user.id} profile={profile}  today={today}
    todayTasks={todayTasks ?? []} activeProjects={activeProjects ?? []}
    todayHabits={todayHabits ?? []} habitLogs={habitLogs ?? []}
    todayGym={todayGym ?? null} todaySkincare={todaySkincare ?? []}
    monthlySpend={monthlySpend} upcomingReminders={upcomingReminders ?? []}
    activeGoals={activeGoals ?? []} learningPaths={learningPaths ?? []} />;
}

function DashboardShell({ userId, profile, today, todayTasks, activeProjects, todayHabits,
  habitLogs, todayGym, todaySkincare, monthlySpend, upcomingReminders, activeGoals, learningPaths }: any) {
  const tasksDone = todayTasks.filter((t: any) => t.status === "done").length;
  const habitsCompleted = habitLogs.filter((l: any) => l.completed).length;
  const greeting = (() => { const h = new Date().getHours(); if (h < 12) return "Good morning"; if (h < 17) return "Good afternoon"; return "Good evening"; })();

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{greeting}, {profile?.full_name?.split(" ")[0] ?? "Sly"} 👋</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
        </div>
        <DashboardQuickAdd userId={userId} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={CheckSquare} label="Tasks Today" value={`${tasksDone}/${todayTasks.length}`} sub="completed" color="text-blue-400" bg="bg-blue-500/10" />
        <StatCard icon={Activity} label="Habits" value={`${habitsCompleted}/${todayHabits.length}`} sub="checked off" color="text-green-400" bg="bg-green-500/10" />
        <StatCard icon={Dumbbell} label="Gym" value={todayGym ? "Done ✓" : "Not yet"} sub="today" color="text-red-400" bg="bg-red-500/10" />
        <StatCard icon={Wallet} label="Spent" value={formatCurrency(monthlySpend)} sub="this month" color="text-yellow-400" bg="bg-yellow-500/10" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><CheckSquare className="w-4 h-4 text-blue-400" />Today&apos;s Tasks</CardTitle>
              <Link href="/tasks" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {!todayTasks.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No tasks due today — <Link href="/tasks" className="text-red-400 hover:underline">add some</Link>.</p>
            ) : todayTasks.map((task: any) => (
              <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50">
                <div className={`w-2 h-2 rounded-full shrink-0 ${task.status === "done" ? "bg-green-400" : task.status === "in_progress" ? "bg-blue-400" : "bg-zinc-500"}`} />
                <span className={`text-sm flex-1 ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>{task.title}</span>
                <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>{task.priority}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Flame className="w-4 h-4 text-orange-400" />Habits</CardTitle>
              <Link href="/habits" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {!todayHabits.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center"><Link href="/habits" className="text-red-400 hover:underline">Set up habits</Link> to track.</p>
            ) : todayHabits.map((habit: any) => {
              const done = habitLogs.some((l: any) => l.habit_id === habit.id && l.completed);
              return (
                <div key={habit.id} className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded flex items-center justify-center text-xs ${done ? "bg-green-500/20 text-green-400 border border-green-500/30" : "border border-border"}`}>{done ? "✓" : ""}</div>
                  <span className={`text-sm ${done ? "text-muted-foreground line-through" : ""}`}>{habit.icon} {habit.name}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><FolderKanban className="w-4 h-4 text-purple-400" />Projects</CardTitle>
              <Link href="/projects" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!activeProjects.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center"><Link href="/projects" className="text-red-400 hover:underline">Create a project</Link>.</p>
            ) : activeProjects.map((p: any) => (
              <div key={p.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{p.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{p.progress}%</span>
                </div>
                <Progress value={p.progress} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Target className="w-4 h-4 text-green-400" />Goals</CardTitle>
              <Link href="/goals" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!activeGoals.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center"><Link href="/goals" className="text-red-400 hover:underline">Set your goals</Link>.</p>
            ) : activeGoals.map((g: any) => (
              <div key={g.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{g.title}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{g.progress}%</span>
                </div>
                <Progress value={g.progress} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><GraduationCap className="w-4 h-4 text-cyan-400" />Learning</CardTitle>
              <Link href="/learning" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!learningPaths.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center"><Link href="/learning" className="text-red-400 hover:underline">Start a learning path</Link>.</p>
            ) : learningPaths.map((path: any) => (
              <div key={path.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{path.icon} {path.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{path.progress}%</span>
                </div>
                <Progress value={path.progress} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Bell className="w-4 h-4 text-yellow-400" />Upcoming</CardTitle>
              <Link href="/reminders" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {!upcomingReminders.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No upcoming reminders.</p>
            ) : upcomingReminders.map((r: any) => (
              <div key={r.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-secondary/50">
                <AlertCircle className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(r.due_date), "MMM d")}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-pink-400" />Skincare Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {["morning", "night"].map((tod) => {
                const done = todaySkincare?.some((l: any) => l.time_of_day === tod);
                return (
                  <div key={tod} className={`rounded-lg border p-3 text-center ${done ? "border-green-500/30 bg-green-500/10" : "border-border"}`}>
                    <div className="text-lg mb-1">{tod === "morning" ? "☀️" : "🌙"}</div>
                    <p className="text-xs font-medium capitalize">{tod}</p>
                    <p className={`text-xs mt-0.5 ${done ? "text-green-400" : "text-muted-foreground"}`}>{done ? "Done ✓" : "Not logged"}</p>
                  </div>
                );
              })}
            </div>
            <Link href="/skincare" className="mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              Log skincare <ArrowRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color, bg }: any) {
  return (
    <Card><CardContent className="pt-4 pb-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold mt-1">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
        </div>
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}><Icon className={`w-4 h-4 ${color}`} /></div>
      </div>
    </CardContent></Card>
  );
}
