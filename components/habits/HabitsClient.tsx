"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Habit, HabitLog } from "@/lib/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Activity, Plus, Trash2, MoreVertical, Loader2, Flame, CheckCircle } from "lucide-react";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { calculateStreak } from "@/lib/utils";
import { toast } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils";

interface HabitsClientProps {
  initialHabits: Habit[];
  initialLogs: HabitLog[];
  userId: string;
}

const HABIT_COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];
const HABIT_ICONS = ["🏋️", "🧴", "💧", "📚", "🚫", "😴", "🏃", "🥗", "🧘", "💊", "✍️", "🎯"];

export function HabitsClient({ initialHabits, initialLogs, userId }: HabitsClientProps) {
  const supabase = createClient();
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [logs, setLogs] = useState<HabitLog[]>(initialLogs);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", icon: "🎯", color: "#ef4444" });

  const today = format(new Date(), "yyyy-MM-dd");
  const last7 = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() }).map((d) => format(d, "yyyy-MM-dd"));

  const todayLogs = logs.filter((l) => l.log_date === today && l.completed);
  const totalCompleted = habits.length > 0 ? Math.round((todayLogs.length / habits.length) * 100) : 0;

  async function toggleHabit(habit: Habit) {
    const existing = logs.find((l) => l.habit_id === habit.id && l.log_date === today);
    if (existing) {
      await supabase.from("habit_logs").delete().eq("id", existing.id);
      setLogs((prev) => prev.filter((l) => l.id !== existing.id));
    } else {
      const { data } = await supabase.from("habit_logs").insert({
        habit_id: habit.id, user_id: userId, log_date: today, completed: true,
      }).select().single();
      if (data) setLogs((prev) => [...prev, data]);
    }
  }

  async function createHabit() {
    if (!form.name.trim()) return;
    setSaving(true);
    const { data, error } = await supabase.from("habits").insert({
      user_id: userId, name: form.name, description: form.description || null,
      icon: form.icon, color: form.color, frequency: "daily", is_active: true,
      target_days: [0, 1, 2, 3, 4, 5, 6],
    }).select().single();
    setSaving(false);
    if (!error && data) setHabits((prev) => [...prev, data]);
    toast({ title: "Habit created!" });
    setDialogOpen(false);
    setForm({ name: "", description: "", icon: "🎯", color: "#ef4444" });
  }

  async function deleteHabit(id: string) {
    await supabase.from("habits").update({ is_active: false }).eq("id", id);
    setHabits((prev) => prev.filter((h) => h.id !== id));
    toast({ title: "Habit archived" });
  }

  const getStreakForHabit = (habitId: string) => {
    const habitLogs = logs.filter((l) => l.habit_id === habitId && l.completed).map((l) => ({ date: l.log_date }));
    return calculateStreak(habitLogs);
  };

  const weeklyCompletion = useMemo(() => {
    const completed = last7.filter((day) => {
      if (day === today) return todayLogs.length === habits.length && habits.length > 0;
      const dayLogs = logs.filter((l) => l.log_date === day && l.completed);
      return dayLogs.length === habits.length && habits.length > 0;
    });
    return Math.round((completed.length / 7) * 100);
  }, [logs, habits, last7, today, todayLogs.length]);

  return (
    <>
      <PageHeader
        icon={Activity}
        title="Habit Tracker"
        description={`${todayLogs.length}/${habits.length} done today`}
        actions={<Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5"><Plus className="w-4 h-4" />New Habit</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card><CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground">Today</p>
          <p className="text-2xl font-bold mt-1">{totalCompleted}%</p>
          <p className="text-xs text-muted-foreground">completed</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground">This week</p>
          <p className="text-2xl font-bold mt-1">{weeklyCompletion}%</p>
          <p className="text-xs text-muted-foreground">completion</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground">Habits</p>
          <p className="text-2xl font-bold mt-1">{habits.length}</p>
          <p className="text-xs text-muted-foreground">active</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground">Best streak</p>
          <p className="text-2xl font-bold mt-1">{Math.max(0, ...habits.map((h) => getStreakForHabit(h.id)))}</p>
          <p className="text-xs text-muted-foreground">days</p>
        </CardContent></Card>
      </div>

      {/* Today's checklist */}
      {!habits.length ? (
        <EmptyState icon={Activity} title="No habits yet" description="Create habits to track daily." actionLabel="New Habit" onAction={() => setDialogOpen(true)} />
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            {habits.map((habit) => {
              const done = todayLogs.some((l) => l.habit_id === habit.id);
              const streak = getStreakForHabit(habit.id);
              return (
                <div key={habit.id} className={cn(
                  "flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none",
                  done ? "border-green-500/30 bg-green-500/5" : "border-border bg-card hover:bg-secondary/30"
                )} onClick={() => toggleHabit(habit)}>
                  <button className={cn(
                    "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                    done ? "bg-green-500 border-green-500 text-white" : "border-border"
                  )} style={{ borderColor: done ? undefined : habit.color }}>
                    {done ? <CheckCircle className="w-4 h-4" /> : <span className="text-base">{habit.icon}</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${done ? "text-muted-foreground line-through" : ""}`}>{habit.name}</p>
                    {habit.description && <p className="text-xs text-muted-foreground">{habit.description}</p>}
                  </div>
                  {streak > 0 && (
                    <div className="flex items-center gap-1 text-xs text-orange-400">
                      <Flame className="w-3.5 h-3.5" />{streak}
                    </div>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteHabit(habit.id); }} className="text-red-400">
                        <Trash2 className="w-3.5 h-3.5 mr-2" />Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>

          {/* Last 7 days heatmap */}
          <Card className="mt-6">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Last 7 days</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2 overflow-x-auto">
                {habits.map((habit) => (
                  <div key={habit.id} className="flex flex-col gap-1 min-w-[80px]">
                    <p className="text-[10px] text-muted-foreground truncate">{habit.icon} {habit.name}</p>
                    <div className="flex gap-1">
                      {last7.map((day) => {
                        const done = logs.some((l) => l.habit_id === habit.id && l.log_date === day && l.completed);
                        return (
                          <div
                            key={day}
                            title={day}
                            className={cn("w-5 h-5 rounded-sm border", done ? "border-transparent" : "border-border bg-secondary")}
                            style={done ? { backgroundColor: habit.color + "60", borderColor: habit.color + "40" } : undefined}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Habit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) setDialogOpen(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New Habit</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Name *</Label><Input placeholder="Gym, Water, Skincare…" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} autoFocus /></div>
            <div className="space-y-1.5"><Label>Description</Label><Input placeholder="Optional details" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
            <div className="space-y-1.5">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {HABIT_ICONS.map((icon) => (
                  <button key={icon} className={`w-9 h-9 rounded-lg border text-lg transition-colors ${form.icon === icon ? "border-primary bg-primary/20" : "border-border hover:border-foreground"}`} onClick={() => setForm((f) => ({ ...f, icon }))}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {HABIT_COLORS.map((c) => (
                  <button key={c} className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${form.color === c ? "border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} onClick={() => setForm((f) => ({ ...f, color: c }))} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={createHabit} disabled={saving || !form.name.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
