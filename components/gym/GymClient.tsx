"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GymLog, Exercise } from "@/lib/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dumbbell, Plus, Trash2, MoreVertical, Loader2, Trophy, Scale, Flame, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/lib/hooks/use-toast";

interface GymClientProps {
  initialLogs: GymLog[];
  initialExercises: Exercise[];
  userId: string;
}

interface ExerciseForm { name: string; sets: number; reps: number; weight_kg: number; is_pr: boolean; notes: string; }
const EMPTY_EX: ExerciseForm = { name: "", sets: 3, reps: 10, weight_kg: 0, is_pr: false, notes: "" };

export function GymClient({ initialLogs, initialExercises, userId }: GymClientProps) {
  const supabase = createClient();
  const [logs, setLogs] = useState<GymLog[]>(initialLogs);
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(logs[0]?.id ?? null);
  const [logForm, setLogForm] = useState({ workout_date: format(new Date(), "yyyy-MM-dd"), workout_type: "", duration_minutes: "", notes: "", bodyweight: "" });
  const [currentLogId, setCurrentLogId] = useState<string | null>(null);
  const [exerciseForms, setExerciseForms] = useState<ExerciseForm[]>([{ ...EMPTY_EX }]);
  const [addExDialogOpen, setAddExDialogOpen] = useState(false);
  const [selectedLogForEx, setSelectedLogForEx] = useState<string | null>(null);

  const stats = useMemo(() => {
    const thisWeek = logs.filter((l) => {
      const d = new Date(l.workout_date);
      const now = new Date();
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      return d >= weekAgo;
    });
    const totalSessions = logs.length;
    const prs = exercises.filter((e) => e.is_pr).length;
    const lastBodyweight = logs.find((l) => l.bodyweight)?.bodyweight;
    return { thisWeek: thisWeek.length, totalSessions, prs, lastBodyweight };
  }, [logs, exercises]);

  async function createLog() {
    if (!logForm.workout_date) return;
    setSaving(true);
    const { data, error } = await supabase.from("gym_logs").insert({
      user_id: userId,
      workout_date: logForm.workout_date,
      workout_type: logForm.workout_type || null,
      duration_minutes: logForm.duration_minutes ? parseInt(logForm.duration_minutes) : null,
      notes: logForm.notes || null,
      bodyweight: logForm.bodyweight ? parseFloat(logForm.bodyweight) : null,
    }).select().single();
    if (!error && data) {
      setLogs((prev) => [data, ...prev]);
      setCurrentLogId(data.id);
      // Save exercises
      if (exerciseForms.some((e) => e.name.trim())) {
        const exToInsert = exerciseForms.filter((e) => e.name.trim()).map((e) => ({
          gym_log_id: data.id, user_id: userId,
          name: e.name.trim(), sets: e.sets, reps: e.reps || null,
          weight_kg: e.weight_kg || null, is_pr: e.is_pr, notes: e.notes || null,
        }));
        const { data: exData } = await supabase.from("exercises").insert(exToInsert).select();
        if (exData) setExercises((prev) => [...exData, ...prev]);
      }
      toast({ title: "Workout logged!" });
      setExpandedLogId(data.id);
    }
    setSaving(false);
    setLogDialogOpen(false);
    setLogForm({ workout_date: format(new Date(), "yyyy-MM-dd"), workout_type: "", duration_minutes: "", notes: "", bodyweight: "" });
    setExerciseForms([{ ...EMPTY_EX }]);
  }

  async function addExerciseToLog(logId: string, exForm: ExerciseForm) {
    const { data, error } = await supabase.from("exercises").insert({
      gym_log_id: logId, user_id: userId,
      name: exForm.name.trim(), sets: exForm.sets,
      reps: exForm.reps || null, weight_kg: exForm.weight_kg || null,
      is_pr: exForm.is_pr, notes: exForm.notes || null,
    }).select().single();
    if (!error && data) {
      setExercises((prev) => [data, ...prev]);
      toast({ title: "Exercise added" });
    }
    setAddExDialogOpen(false);
  }

  async function deleteLog(id: string) {
    await supabase.from("gym_logs").delete().eq("id", id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
    setExercises((prev) => prev.filter((e) => e.gym_log_id !== id));
    toast({ title: "Workout deleted" });
  }

  const WORKOUT_TYPES = ["Push", "Pull", "Legs", "Upper", "Lower", "Full Body", "Cardio", "HIIT", "Arms", "Shoulders", "Back", "Chest"];

  return (
    <>
      <PageHeader
        icon={Dumbbell}
        title="Gym Log"
        description="Track workouts, exercises, and progress"
        actions={<Button size="sm" onClick={() => setLogDialogOpen(true)} className="gap-1.5"><Plus className="w-4 h-4" />Log Workout</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card><CardContent className="pt-4 pb-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center"><Flame className="w-4 h-4 text-red-400" /></div>
          <div><p className="text-xs text-muted-foreground">This week</p><p className="text-lg font-bold">{stats.thisWeek}</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center"><Dumbbell className="w-4 h-4 text-blue-400" /></div>
          <div><p className="text-xs text-muted-foreground">Total sessions</p><p className="text-lg font-bold">{stats.totalSessions}</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center"><Trophy className="w-4 h-4 text-yellow-400" /></div>
          <div><p className="text-xs text-muted-foreground">Personal Records</p><p className="text-lg font-bold">{stats.prs}</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center"><Scale className="w-4 h-4 text-green-400" /></div>
          <div><p className="text-xs text-muted-foreground">Bodyweight</p><p className="text-lg font-bold">{stats.lastBodyweight ?? "—"}kg</p></div>
        </CardContent></Card>
      </div>

      {/* Workout list */}
      {!logs.length ? (
        <EmptyState icon={Dumbbell} title="No workouts logged" description="Start tracking your workouts." actionLabel="Log Workout" onAction={() => setLogDialogOpen(true)} />
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const logExercises = exercises.filter((e) => e.gym_log_id === log.id);
            const isExpanded = expandedLogId === log.id;
            return (
              <Card key={log.id}>
                <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-secondary/20" onClick={() => setExpandedLogId(isExpanded ? null : log.id)}>
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-red-400">{format(new Date(log.workout_date), "d")}</span>
                    <span className="text-[9px] text-muted-foreground">{format(new Date(log.workout_date), "MMM")}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{log.workout_type ?? "Workout"}</span>
                      {log.duration_minutes && <Badge variant="outline" className="text-xs">{log.duration_minutes}min</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{logExercises.length} exercises{log.bodyweight ? ` · ${log.bodyweight}kg` : ""}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedLogForEx(log.id); setAddExDialogOpen(true); }}>
                          <Plus className="w-3.5 h-3.5 mr-2" />Add exercise
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteLog(log.id); }} className="text-red-400">
                          <Trash2 className="w-3.5 h-3.5 mr-2" />Delete workout
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {isExpanded && (
                  <CardContent className="pt-0 border-t border-border">
                    {log.notes && <p className="text-xs text-muted-foreground mb-3">{log.notes}</p>}
                    {logExercises.length ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-12 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                          <span className="col-span-4">Exercise</span>
                          <span className="col-span-2 text-center">Sets</span>
                          <span className="col-span-2 text-center">Reps</span>
                          <span className="col-span-3 text-center">Weight</span>
                          <span className="col-span-1" />
                        </div>
                        {logExercises.map((ex) => (
                          <div key={ex.id} className="grid grid-cols-12 items-center text-sm px-1 py-1 rounded hover:bg-secondary/30">
                            <div className="col-span-4 flex items-center gap-1">
                              <span className="truncate">{ex.name}</span>
                              {ex.is_pr && <Trophy className="w-3 h-3 text-yellow-400 shrink-0" />}
                            </div>
                            <span className="col-span-2 text-center text-muted-foreground">{ex.sets}</span>
                            <span className="col-span-2 text-center text-muted-foreground">{ex.reps ?? "—"}</span>
                            <span className="col-span-3 text-center text-muted-foreground">{ex.weight_kg ? `${ex.weight_kg}kg` : "BW"}</span>
                            <div className="col-span-1 flex justify-end">
                              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={async () => {
                                await supabase.from("exercises").delete().eq("id", ex.id);
                                setExercises((prev) => prev.filter((e) => e.id !== ex.id));
                              }}>
                                <Trash2 className="w-3 h-3 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-2">No exercises logged.</p>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Log Workout Dialog */}
      <Dialog open={logDialogOpen} onOpenChange={(o) => { if (!o) setLogDialogOpen(false); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Log Workout</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={logForm.workout_date} onChange={(e) => setLogForm((f) => ({ ...f, workout_date: e.target.value }))} /></div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={logForm.workout_type} onChange={(e) => setLogForm((f) => ({ ...f, workout_type: e.target.value }))}>
                  <option value="">Select…</option>
                  {WORKOUT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5"><Label>Duration (min)</Label><Input type="number" placeholder="60" value={logForm.duration_minutes} onChange={(e) => setLogForm((f) => ({ ...f, duration_minutes: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Bodyweight (kg)</Label><Input type="number" step="0.1" placeholder="75.0" value={logForm.bodyweight} onChange={(e) => setLogForm((f) => ({ ...f, bodyweight: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Notes</Label><Textarea placeholder="How did the session feel?" value={logForm.notes} onChange={(e) => setLogForm((f) => ({ ...f, notes: e.target.value }))} rows={2} /></div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Exercises</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setExerciseForms((prev) => [...prev, { ...EMPTY_EX }])}>+ Add</Button>
              </div>
              {exerciseForms.map((ex, i) => (
                <div key={i} className="grid grid-cols-12 gap-1.5 items-end">
                  <div className="col-span-4"><Input placeholder="Exercise" value={ex.name} onChange={(e) => setExerciseForms((prev) => prev.map((f, j) => j === i ? { ...f, name: e.target.value } : f))} /></div>
                  <div className="col-span-2"><Input type="number" placeholder="Sets" value={ex.sets} onChange={(e) => setExerciseForms((prev) => prev.map((f, j) => j === i ? { ...f, sets: parseInt(e.target.value) || 1 } : f))} /></div>
                  <div className="col-span-2"><Input type="number" placeholder="Reps" value={ex.reps || ""} onChange={(e) => setExerciseForms((prev) => prev.map((f, j) => j === i ? { ...f, reps: parseInt(e.target.value) || 0 } : f))} /></div>
                  <div className="col-span-3"><Input type="number" step="0.5" placeholder="kg" value={ex.weight_kg || ""} onChange={(e) => setExerciseForms((prev) => prev.map((f, j) => j === i ? { ...f, weight_kg: parseFloat(e.target.value) || 0 } : f))} /></div>
                  <div className="col-span-1 flex justify-end">
                    {exerciseForms.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExerciseForms((prev) => prev.filter((_, j) => j !== i))}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogDialogOpen(false)}>Cancel</Button>
            <Button onClick={createLog} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Workout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Exercise to existing log */}
      <Dialog open={addExDialogOpen} onOpenChange={setAddExDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Exercise</DialogTitle></DialogHeader>
          <AddExerciseForm onSave={(ex) => { if (selectedLogForEx) addExerciseToLog(selectedLogForEx, ex); }} onCancel={() => setAddExDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function AddExerciseForm({ onSave, onCancel }: { onSave: (ex: ExerciseForm) => void; onCancel: () => void }) {
  const [form, setForm] = useState<ExerciseForm>({ ...EMPTY_EX });
  return (
    <div className="space-y-3">
      <div className="space-y-1.5"><Label>Exercise name</Label><Input placeholder="Bench Press" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} autoFocus /></div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1.5"><Label>Sets</Label><Input type="number" value={form.sets} onChange={(e) => setForm((f) => ({ ...f, sets: parseInt(e.target.value) || 1 }))} /></div>
        <div className="space-y-1.5"><Label>Reps</Label><Input type="number" value={form.reps || ""} onChange={(e) => setForm((f) => ({ ...f, reps: parseInt(e.target.value) || 0 }))} /></div>
        <div className="space-y-1.5"><Label>Weight (kg)</Label><Input type="number" step="0.5" value={form.weight_kg || ""} onChange={(e) => setForm((f) => ({ ...f, weight_kg: parseFloat(e.target.value) || 0 }))} /></div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="is_pr" checked={form.is_pr} onChange={(e) => setForm((f) => ({ ...f, is_pr: e.target.checked }))} className="w-4 h-4 rounded" />
        <Label htmlFor="is_pr" className="cursor-pointer flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-yellow-400" /> Personal Record</Label>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form)} disabled={!form.name.trim()}>Add</Button>
      </DialogFooter>
    </div>
  );
}
