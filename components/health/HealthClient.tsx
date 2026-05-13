"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { HealthLog } from "@/lib/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Heart, Plus, Loader2, Moon, Zap, Scale, Droplets, Utensils, Smile } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/lib/hooks/use-toast";

interface HealthClientProps {
  initialLogs: HealthLog[];
  userId: string;
}

export function HealthClient({ initialLogs, userId }: HealthClientProps) {
  const supabase = createClient();
  const [logs, setLogs] = useState<HealthLog[]>(initialLogs);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    log_date: format(new Date(), "yyyy-MM-dd"),
    sleep_hours: "", mood: "", energy: "", weight_kg: "",
    water_ml: "", protein_g: "", calories: "", symptoms: "", notes: "",
  });

  const today = format(new Date(), "yyyy-MM-dd");
  const todayLog = logs.find((l) => l.log_date === today);

  const avg7 = useMemo(() => {
    const recent = logs.slice(0, 7);
    if (!recent.length) return null;
    const avg = (key: keyof HealthLog) => {
      const vals = recent.map((l) => l[key]).filter((v): v is number => typeof v === "number");
      return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "—";
    };
    return { sleep: avg("sleep_hours"), mood: avg("mood"), energy: avg("energy") };
  }, [logs]);

  async function saveLog() {
    setSaving(true);
    const data_to_save = {
      user_id: userId, log_date: form.log_date,
      sleep_hours: form.sleep_hours ? parseFloat(form.sleep_hours) : null,
      mood: form.mood ? parseInt(form.mood) : null,
      energy: form.energy ? parseInt(form.energy) : null,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      water_ml: form.water_ml ? parseInt(form.water_ml) : null,
      protein_g: form.protein_g ? parseInt(form.protein_g) : null,
      calories: form.calories ? parseInt(form.calories) : null,
      symptoms: form.symptoms || null, notes: form.notes || null,
    };
    const { data, error } = await supabase.from("health_logs").upsert(data_to_save, { onConflict: "user_id,log_date" }).select().single();
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    if (data) setLogs((prev) => { const filtered = prev.filter((l) => l.log_date !== data.log_date); return [data, ...filtered]; });
    toast({ title: "Health log saved!" });
    setDialogOpen(false);
  }

  const openLog = (log?: HealthLog) => {
    if (log) {
      setForm({
        log_date: log.log_date,
        sleep_hours: log.sleep_hours?.toString() ?? "",
        mood: log.mood?.toString() ?? "",
        energy: log.energy?.toString() ?? "",
        weight_kg: log.weight_kg?.toString() ?? "",
        water_ml: log.water_ml?.toString() ?? "",
        protein_g: log.protein_g?.toString() ?? "",
        calories: log.calories?.toString() ?? "",
        symptoms: log.symptoms ?? "",
        notes: log.notes ?? "",
      });
    } else {
      setForm({ log_date: today, sleep_hours: "", mood: "", energy: "", weight_kg: "", water_ml: "", protein_g: "", calories: "", symptoms: "", notes: "" });
    }
    setDialogOpen(true);
  };

  const METRICS = [
    { key: "sleep_hours", label: "Sleep", icon: Moon, unit: "hrs", color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { key: "mood", label: "Mood", icon: Smile, unit: "/10", color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { key: "energy", label: "Energy", icon: Zap, unit: "/10", color: "text-orange-400", bg: "bg-orange-500/10" },
    { key: "water_ml", label: "Water", icon: Droplets, unit: "ml", color: "text-blue-400", bg: "bg-blue-500/10" },
    { key: "weight_kg", label: "Weight", icon: Scale, unit: "kg", color: "text-green-400", bg: "bg-green-500/10" },
    { key: "calories", label: "Calories", icon: Utensils, unit: "kcal", color: "text-red-400", bg: "bg-red-500/10" },
  ];

  return (
    <>
      <PageHeader
        icon={Heart}
        title="Health Tracker"
        description="Daily sleep, mood, energy, and nutrition"
        actions={<Button size="sm" onClick={() => openLog()} className="gap-1.5"><Plus className="w-4 h-4" />Log Today</Button>}
      />

      {/* Today snapshot */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        {METRICS.map(({ key, label, icon: Icon, unit, color, bg }) => {
          const val = todayLog?.[key as keyof HealthLog];
          return (
            <Card key={key} className="cursor-pointer hover:border-border/80" onClick={() => openLog(todayLog)}>
              <CardContent className="pt-3 pb-3 text-center">
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mx-auto mb-1`}><Icon className={`w-4 h-4 ${color}`} /></div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-bold mt-0.5">{val != null ? `${val}${unit}` : "—"}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 7-day averages */}
      {avg7 && (
        <Card className="mb-6">
          <CardHeader className="pb-2"><CardTitle className="text-sm">7-day averages</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-6">
              <div><p className="text-xs text-muted-foreground">Sleep</p><p className="text-xl font-bold">{avg7.sleep}h</p></div>
              <div><p className="text-xs text-muted-foreground">Mood</p><p className="text-xl font-bold">{avg7.mood}/10</p></div>
              <div><p className="text-xs text-muted-foreground">Energy</p><p className="text-xl font-bold">{avg7.energy}/10</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Log history */}
      {!logs.length ? (
        <EmptyState icon={Heart} title="No health logs" description="Start tracking your daily health metrics." actionLabel="Log Today" onAction={() => openLog()} />
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">History</p>
          {logs.map((log) => (
            <div key={log.id} className="flex items-center gap-4 p-3 rounded-lg border border-border bg-card hover:bg-secondary/20 cursor-pointer" onClick={() => openLog(log)}>
              <div className="w-10 h-10 rounded-lg bg-secondary flex flex-col items-center justify-center shrink-0">
                <span className="text-xs font-bold">{format(new Date(log.log_date), "d")}</span>
                <span className="text-[9px] text-muted-foreground">{format(new Date(log.log_date), "MMM")}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                {log.sleep_hours && <span>😴 {log.sleep_hours}h</span>}
                {log.mood && <span>😊 {log.mood}/10</span>}
                {log.energy && <span>⚡ {log.energy}/10</span>}
                {log.weight_kg && <span>⚖️ {log.weight_kg}kg</span>}
                {log.water_ml && <span>💧 {log.water_ml}ml</span>}
                {log.calories && <span>🍽 {log.calories}kcal</span>}
              </div>
              {(log.symptoms || log.notes) && (
                <p className="text-xs text-muted-foreground ml-auto hidden md:block truncate max-w-xs">{log.symptoms || log.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) setDialogOpen(false); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Health Log</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.log_date} onChange={(e) => setForm((f) => ({ ...f, log_date: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5"><Label>Sleep (hours)</Label><Input type="number" step="0.5" min={0} max={24} placeholder="7.5" value={form.sleep_hours} onChange={(e) => setForm((f) => ({ ...f, sleep_hours: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Mood (1–10)</Label><Input type="number" min={1} max={10} placeholder="7" value={form.mood} onChange={(e) => setForm((f) => ({ ...f, mood: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5"><Label>Energy (1–10)</Label><Input type="number" min={1} max={10} placeholder="7" value={form.energy} onChange={(e) => setForm((f) => ({ ...f, energy: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Weight (kg)</Label><Input type="number" step="0.1" placeholder="75.0" value={form.weight_kg} onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5"><Label>Water (ml)</Label><Input type="number" step="100" placeholder="2000" value={form.water_ml} onChange={(e) => setForm((f) => ({ ...f, water_ml: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Protein (g)</Label><Input type="number" placeholder="150" value={form.protein_g} onChange={(e) => setForm((f) => ({ ...f, protein_g: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Calories</Label><Input type="number" placeholder="2200" value={form.calories} onChange={(e) => setForm((f) => ({ ...f, calories: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Symptoms</Label><Input placeholder="Headache, fatigue, congestion…" value={form.symptoms} onChange={(e) => setForm((f) => ({ ...f, symptoms: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Notes</Label><Textarea placeholder="Any other notes…" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveLog} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
