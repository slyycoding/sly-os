"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Reminder } from "@/lib/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Bell, Plus, Check, Trash2, Loader2, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "@/lib/hooks/use-toast";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { cn } from "@/lib/utils";

const REMINDER_TYPES = ["bill", "subscription", "gym", "skincare", "deadline", "study", "product", "custom"];
const TYPE_ICONS: Record<string, string> = {
  bill: "💳", subscription: "🔄", gym: "🏋️", skincare: "🧴",
  deadline: "⏰", study: "📚", product: "📦", custom: "🔔",
};

interface RemindersClientProps {
  initialReminders: Reminder[];
  userId: string;
}

const EMPTY_FORM = { title: "", description: "", reminder_type: "custom", due_date: "", due_time: "" };

export function RemindersClient({ initialReminders, userId }: RemindersClientProps) {
  const supabase = createClient();
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const today = format(new Date(), "yyyy-MM-dd");
  const upcoming = reminders.filter((r) => !r.is_completed && r.due_date >= today);
  const overdue = reminders.filter((r) => !r.is_completed && r.due_date < today);
  const completed = reminders.filter((r) => r.is_completed);

  async function saveReminder() {
    if (!form.title.trim() || !form.due_date) return;
    setSaving(true);
    const { data, error } = await supabase.from("reminders").insert({
      user_id: userId, title: form.title, description: form.description || null,
      reminder_type: form.reminder_type as Reminder["reminder_type"],
      due_date: form.due_date, due_time: form.due_time || null,
      is_recurring: false, is_completed: false,
    }).select().single();
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    if (data) setReminders((prev) => [...prev, data].sort((a, b) => a.due_date.localeCompare(b.due_date)));
    toast({ title: "Reminder set!" });
    setDialogOpen(false);
    setForm(EMPTY_FORM);
  }

  async function completeReminder(id: string) {
    await supabase.from("reminders").update({ is_completed: true }).eq("id", id);
    setReminders((prev) => prev.map((r) => r.id === id ? { ...r, is_completed: true } : r));
    toast({ title: "Reminder completed" });
  }

  async function deleteReminder(id: string) {
    await supabase.from("reminders").delete().eq("id", id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }

  const renderReminder = (r: Reminder) => {
    const d = new Date(r.due_date);
    const isOverdue = !r.is_completed && isPast(d) && !isToday(d);
    const label = isToday(d) ? "Today" : isTomorrow(d) ? "Tomorrow" : formatDate(r.due_date);

    return (
      <div key={r.id} className={cn(
        "flex items-start gap-3 p-3.5 rounded-lg border transition-colors",
        r.is_completed ? "opacity-50 border-border/50 bg-card" : isOverdue ? "border-red-500/30 bg-red-500/5" : "border-border bg-card hover:bg-secondary/20"
      )}>
        <div className="text-lg shrink-0">{TYPE_ICONS[r.reminder_type] ?? "🔔"}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-medium ${r.is_completed ? "line-through text-muted-foreground" : ""}`}>{r.title}</p>
            {isOverdue && <Badge variant="danger" className="text-xs">Overdue</Badge>}
          </div>
          {r.description && <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>}
          <p className={`text-xs mt-1 ${isOverdue ? "text-red-400" : "text-muted-foreground"}`}>
            {label}{r.due_time ? ` at ${r.due_time.slice(0, 5)}` : ""}
          </p>
        </div>
        {!r.is_completed && (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-green-400 hover:text-green-300 hover:bg-green-500/10 shrink-0" onClick={() => completeReminder(r.id)}>
            <Check className="w-4 h-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-400 shrink-0" onClick={() => deleteReminder(r.id)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  };

  return (
    <>
      <PageHeader
        icon={Bell}
        title="Reminders"
        description={`${upcoming.length} upcoming · ${overdue.length} overdue`}
        actions={<Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5"><Plus className="w-4 h-4" />New Reminder</Button>}
      />

      {overdue.length > 0 && (
        <div className="space-y-2 mb-6">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> Overdue ({overdue.length})
          </p>
          {overdue.map(renderReminder)}
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-2 mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upcoming ({upcoming.length})</p>
          {upcoming.map(renderReminder)}
        </div>
      )}

      {!upcoming.length && !overdue.length && (
        <EmptyState icon={Bell} title="No reminders" description="Set reminders for bills, skincare, gym, and more." actionLabel="New Reminder" onAction={() => setDialogOpen(true)} />
      )}

      {completed.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completed ({completed.length})</p>
          {completed.slice(0, 10).map(renderReminder)}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) setDialogOpen(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New Reminder</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Title *</Label><Input placeholder="What to remind you of?" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} autoFocus /></div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.reminder_type} onValueChange={(v) => setForm((f) => ({ ...f, reminder_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REMINDER_TYPES.map((t) => <SelectItem key={t} value={t}>{TYPE_ICONS[t]} {t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5"><Label>Due date *</Label><Input type="date" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Time (optional)</Label><Input type="time" value={form.due_time} onChange={(e) => setForm((f) => ({ ...f, due_time: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Notes</Label><Input placeholder="Optional details" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveReminder} disabled={saving || !form.title.trim() || !form.due_date}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Set Reminder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
