"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Goal, GoalCategory, GoalTimeframe } from "@/lib/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Target, Plus, MoreVertical, Trash2, Edit2, Loader2, Trophy } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "@/lib/hooks/use-toast";

const CATEGORIES: GoalCategory[] = ["money", "fitness", "study", "business", "health", "personal"];
const TIMEFRAMES: GoalTimeframe[] = ["daily", "weekly", "monthly", "yearly"];
const CAT_COLORS: Record<string, string> = {
  money: "text-green-400 bg-green-500/10", fitness: "text-red-400 bg-red-500/10",
  study: "text-blue-400 bg-blue-500/10", business: "text-purple-400 bg-purple-500/10",
  health: "text-pink-400 bg-pink-500/10", personal: "text-yellow-400 bg-yellow-500/10",
};
const CAT_ICONS: Record<string, string> = {
  money: "💰", fitness: "💪", study: "📚", business: "🚀", health: "❤️", personal: "⭐",
};

interface GoalsClientProps {
  initialGoals: Goal[];
  userId: string;
}

const EMPTY: Partial<Goal> = {
  title: "", description: null, category: "personal", timeframe: "monthly",
  status: "not_started", progress: 0, deadline: null, notes: null,
};

export function GoalsClient({ initialGoals, userId }: GoalsClientProps) {
  const supabase = createClient();
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Goal>>(EMPTY);
  const [saving, setSaving] = useState(false);

  async function saveGoal() {
    if (!editing.title?.trim()) return;
    setSaving(true);
    if (editing.id) {
      const { data } = await supabase.from("goals").update({
        title: editing.title, description: editing.description ?? null,
        category: editing.category, timeframe: editing.timeframe,
        status: editing.status, progress: editing.progress ?? 0,
        deadline: editing.deadline ?? null, notes: editing.notes ?? null,
      }).eq("id", editing.id).select().single();
      if (data) setGoals((prev) => prev.map((g) => g.id === data.id ? data : g));
    } else {
      const { data } = await supabase.from("goals").insert({
        user_id: userId, title: editing.title, description: editing.description ?? null,
        category: (editing.category as GoalCategory) ?? "personal",
        timeframe: (editing.timeframe as GoalTimeframe) ?? "monthly",
        status: (editing.status as Goal["status"]) ?? "not_started",
        progress: editing.progress ?? 0, deadline: editing.deadline ?? null, notes: editing.notes ?? null,
      }).select().single();
      if (data) setGoals((prev) => [data, ...prev]);
    }
    toast({ title: editing.id ? "Goal updated" : "Goal created!" });
    setSaving(false);
    setDialogOpen(false);
    setEditing(EMPTY);
  }

  async function deleteGoal(id: string) {
    await supabase.from("goals").delete().eq("id", id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
    toast({ title: "Goal deleted" });
  }

  const activeGoals = goals.filter((g) => g.status === "in_progress");
  const notStarted = goals.filter((g) => g.status === "not_started");
  const completed = goals.filter((g) => g.status === "completed");

  const renderGoal = (goal: Goal) => (
    <Card key={goal.id} className="group hover:border-border/80 transition-colors">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-base">{CAT_ICONS[goal.category]}</span>
              <h3 className="text-sm font-semibold">{goal.title}</h3>
              {goal.status === "completed" && <Trophy className="w-4 h-4 text-yellow-400" />}
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge variant="outline" className={`text-xs ${CAT_COLORS[goal.category]}`}>{goal.category}</Badge>
              <Badge variant="outline" className="text-xs">{goal.timeframe}</Badge>
              <Badge variant="outline" className="text-xs capitalize">{goal.status.replace("_", " ")}</Badge>
            </div>
            {goal.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{goal.description}</p>}
            <div className="flex items-center gap-2">
              <Progress value={goal.progress} className="flex-1 h-1.5" />
              <span className="text-xs text-muted-foreground shrink-0">{goal.progress}%</span>
            </div>
            {goal.deadline && <p className="text-xs text-muted-foreground mt-1.5">🎯 By {formatDate(goal.deadline)}</p>}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0">
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setEditing(goal); setDialogOpen(true); }}><Edit2 className="w-3.5 h-3.5 mr-2" />Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => deleteGoal(goal.id)} className="text-red-400"><Trash2 className="w-3.5 h-3.5 mr-2" />Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <PageHeader
        icon={Target}
        title="Goal Tracker"
        description={`${activeGoals.length} active · ${completed.length} completed`}
        actions={<Button size="sm" onClick={() => { setEditing(EMPTY); setDialogOpen(true); }} className="gap-1.5"><Plus className="w-4 h-4" />New Goal</Button>}
      />

      {!goals.length ? (
        <EmptyState icon={Target} title="No goals yet" description="Set your first goal and start tracking." actionLabel="New Goal" onAction={() => setDialogOpen(true)} />
      ) : (
        <Tabs defaultValue="active">
          <TabsList className="mb-4">
            <TabsTrigger value="active">Active ({activeGoals.length})</TabsTrigger>
            <TabsTrigger value="not_started">Not Started ({notStarted.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          <TabsContent value="active">
            {activeGoals.length ? <div className="grid gap-3 md:grid-cols-2">{activeGoals.map(renderGoal)}</div> : <p className="text-sm text-muted-foreground py-6 text-center">No active goals.</p>}
          </TabsContent>
          <TabsContent value="not_started">
            {notStarted.length ? <div className="grid gap-3 md:grid-cols-2">{notStarted.map(renderGoal)}</div> : <p className="text-sm text-muted-foreground py-6 text-center">None.</p>}
          </TabsContent>
          <TabsContent value="completed">
            {completed.length ? <div className="grid gap-3 md:grid-cols-2">{completed.map(renderGoal)}</div> : <p className="text-sm text-muted-foreground py-6 text-center">No completed goals yet. Keep going!</p>}
          </TabsContent>
          <TabsContent value="all">
            <div className="grid gap-3 md:grid-cols-2">{goals.map(renderGoal)}</div>
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setDialogOpen(false); setEditing(EMPTY); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing.id ? "Edit Goal" : "New Goal"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Title *</Label><Input placeholder="What do you want to achieve?" value={editing.title ?? ""} onChange={(e) => setEditing((p) => ({ ...p, title: e.target.value }))} autoFocus /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea placeholder="More details…" value={editing.description ?? ""} onChange={(e) => setEditing((p) => ({ ...p, description: e.target.value || null }))} rows={2} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={editing.category ?? "personal"} onValueChange={(v) => setEditing((p) => ({ ...p, category: v as GoalCategory }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CAT_ICONS[c]} {c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Timeframe</Label>
                <Select value={editing.timeframe ?? "monthly"} onValueChange={(v) => setEditing((p) => ({ ...p, timeframe: v as GoalTimeframe }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIMEFRAMES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={editing.status ?? "not_started"} onValueChange={(v) => setEditing((p) => ({ ...p, status: v as Goal["status"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not started</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="abandoned">Abandoned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Progress (%)</Label><Input type="number" min={0} max={100} value={editing.progress ?? 0} onChange={(e) => setEditing((p) => ({ ...p, progress: parseInt(e.target.value) || 0 }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Deadline</Label><Input type="date" value={editing.deadline ?? ""} onChange={(e) => setEditing((p) => ({ ...p, deadline: e.target.value || null }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveGoal} disabled={saving || !editing.title?.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing.id ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
