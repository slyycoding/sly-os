"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { CalendarEvent } from "@/lib/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar, Plus, ChevronLeft, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/hooks/use-toast";

const EVENT_COLORS: Record<string, string> = {
  work_shift: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  study: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  gym: "bg-red-500/20 text-red-400 border-red-500/30",
  appointment: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  deadline: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  reminder: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  personal: "bg-green-500/20 text-green-400 border-green-500/30",
};

interface CalendarClientProps {
  initialEvents: CalendarEvent[];
  tasks: { id: string; title: string; due_date: string | null; status: string; priority: string }[];
  userId: string;
}

export function CalendarClient({ initialEvents, tasks, userId }: CalendarClientProps) {
  const supabase = createClient();
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("month");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", event_type: "personal", start_date: "", end_date: "",
    start_time: "", end_time: "", all_day: true, description: "", color: "#ef4444",
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  function getEventsForDay(date: Date) {
    const dateStr = format(date, "yyyy-MM-dd");
    const calEvents = events.filter((e) => e.start_date === dateStr);
    const taskEvents = tasks.filter((t) => t.due_date === dateStr && t.status !== "done");
    return { calEvents, taskEvents };
  }

  function openNewEvent(date?: Date) {
    const d = format(date ?? new Date(), "yyyy-MM-dd");
    setForm((f) => ({ ...f, start_date: d, end_date: d, title: "" }));
    setDialogOpen(true);
  }

  async function saveEvent() {
    if (!form.title.trim() || !form.start_date) return;
    setSaving(true);
    const { data, error } = await supabase.from("calendar_events").insert({
      user_id: userId, title: form.title, event_type: form.event_type as CalendarEvent["event_type"],
      start_date: form.start_date, end_date: form.end_date || form.start_date,
      start_time: form.start_time || null, end_time: form.end_time || null,
      all_day: form.all_day, description: form.description || null, color: form.color,
      is_recurring: false,
    }).select().single();
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    if (data) setEvents((prev) => [...prev, data]);
    toast({ title: "Event added" });
    setDialogOpen(false);
  }

  async function deleteEvent(id: string) {
    await supabase.from("calendar_events").delete().eq("id", id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
    toast({ title: "Event deleted" });
  }

  const today = new Date();

  return (
    <>
      <PageHeader
        icon={Calendar}
        title="Calendar"
        description="Week and month view"
        actions={
          <div className="flex items-center gap-2">
            <Tabs value={view} onValueChange={(v) => setView(v as "month" | "week")}>
              <TabsList><TabsTrigger value="month">Month</TabsTrigger><TabsTrigger value="week">Week</TabsTrigger></TabsList>
            </Tabs>
            <Button size="sm" onClick={() => openNewEvent()} className="gap-1.5"><Plus className="w-4 h-4" />Event</Button>
          </div>
        }
      />

      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="icon" onClick={() => setCurrentDate(view === "month" ? subMonths(currentDate, 1) : subWeeks(currentDate, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-base font-semibold">
          {view === "month" ? format(currentDate, "MMMM yyyy") : `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`}
        </h2>
        <Button variant="outline" size="icon" onClick={() => setCurrentDate(view === "month" ? addMonths(currentDate, 1) : addWeeks(currentDate, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className={`grid grid-cols-7 ${view === "month" ? "" : "grid-rows-1"}`}>
          {(view === "month" ? calDays : weekDays).map((day) => {
            const { calEvents, taskEvents } = getEventsForDay(day);
            const isToday = isSameDay(day, today);
            const isCurrentMonth = isSameMonth(day, currentDate);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "border-b border-r border-border p-1.5 cursor-pointer hover:bg-secondary/30 transition-colors",
                  view === "week" ? "min-h-[120px]" : "min-h-[80px]",
                  !isCurrentMonth && view === "month" && "opacity-40"
                )}
                onClick={() => openNewEvent(day)}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mb-1",
                  isToday ? "bg-red-500 text-white" : "text-foreground"
                )}>
                  {format(day, "d")}
                </div>

                <div className="space-y-0.5">
                  {calEvents.slice(0, 2).map((e) => (
                    <div
                      key={e.id}
                      className={cn("text-[10px] px-1 py-0.5 rounded border truncate cursor-pointer", EVENT_COLORS[e.event_type] ?? "bg-zinc-500/20 text-zinc-400")}
                      onClick={(ev) => { ev.stopPropagation(); }}
                    >
                      {e.title}
                    </div>
                  ))}
                  {taskEvents.slice(0, 1).map((t) => (
                    <div key={t.id} className="text-[10px] px-1 py-0.5 rounded border bg-blue-500/10 text-blue-400 border-blue-500/20 truncate">
                      ✓ {t.title}
                    </div>
                  ))}
                  {calEvents.length + taskEvents.length > (view === "month" ? 2 : 3) && (
                    <div className="text-[10px] text-muted-foreground px-1">+{calEvents.length + taskEvents.length - 2} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-3">
        {Object.entries(EVENT_COLORS).map(([type, cls]) => (
          <div key={type} className={cn("text-[10px] px-2 py-0.5 rounded border", cls)}>
            {type.replace("_", " ")}
          </div>
        ))}
      </div>

      {/* Add Event Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Event</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input placeholder="Event title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.event_type} onValueChange={(v) => setForm((f) => ({ ...f, event_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["work_shift", "study", "gym", "appointment", "deadline", "reminder", "personal"].map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Start date</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>End date</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Start time</Label>
                <Input type="time" value={form.start_time} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>End time</Label>
                <Input type="time" value={form.end_time} onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveEvent} disabled={saving || !form.title.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
