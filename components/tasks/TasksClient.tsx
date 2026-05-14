"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Task } from "@/lib/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckSquare, Plus, Search, MoreVertical, Trash2, Edit2, Loader2, Filter,
} from "lucide-react";
import { formatDate, getPriorityColor, getStatusColor } from "@/lib/utils";
import { toast } from "@/lib/hooks/use-toast";
import { format } from "date-fns";

interface TasksClientProps {
  initialTasks: Task[];
  projects: { id: string; name: string }[];
  userId: string;
}

const getEmpty = (): Partial<Task> => ({
  title: "", description: "", status: "not_started", priority: "medium",
  due_date: new Date().toISOString().split("T")[0], due_time: null, tags: [], project_id: null,
});

export function TasksClient({ initialTasks, projects, userId }: TasksClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Task>>(getEmpty());
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const today = format(new Date(), "yyyy-MM-dd");

  // Auto-clear: delete done tasks from previous days on mount
  useEffect(() => {
    const donePastTasks = tasks.filter(
      (t) => t.status === "done" && t.due_date && t.due_date < today
    );
    if (!donePastTasks.length) return;

    const ids = donePastTasks.map((t) => t.id);
    supabase.from("tasks").delete().in("id", ids).then(() => {
      setTasks((prev) => prev.filter((t) => !ids.includes(t.id)));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  const todayTasks = filtered.filter((t) => t.due_date === today);
  const upcomingTasks = filtered.filter((t) => t.due_date && t.due_date > today);
  // "No due date" tasks appear under Other — not overdue ones (those auto-cleared if done)
  const otherTasks = filtered.filter((t) => !t.due_date);
  const overdueTasks = filtered.filter((t) => t.due_date && t.due_date < today);

  async function toggleDone(task: Task) {
    const newStatus = task.status === "done" ? "not_started" : "done";
    const { error } = await supabase.from("tasks").update({
      status: newStatus,
      completed_at: newStatus === "done" ? new Date().toISOString() : null,
    }).eq("id", task.id);
    if (!error) {
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: newStatus } : t));
    }
  }

  async function saveTask() {
    if (!editing.title?.trim()) return;
    setSaving(true);

    if (editing.id) {
      const { data, error } = await supabase.from("tasks").update({
        title: editing.title, description: editing.description ?? null,
        status: editing.status, priority: editing.priority,
        due_date: editing.due_date ?? null, due_time: editing.due_time ?? null,
        tags: editing.tags ?? [], project_id: editing.project_id ?? null,
      }).eq("id", editing.id).select().single();
      if (!error && data) {
        setTasks((prev) => prev.map((t) => t.id === data.id ? data : t));
        toast({ title: "Task updated" });
      }
    } else {
      const { data, error } = await supabase.from("tasks").insert({
        user_id: userId, title: editing.title, description: editing.description ?? null,
        status: (editing.status as Task["status"]) ?? "not_started",
        priority: (editing.priority as Task["priority"]) ?? "medium",
        due_date: editing.due_date ?? null, due_time: editing.due_time ?? null,
        tags: editing.tags ?? [], project_id: editing.project_id ?? null,
        is_recurring: false,
      }).select().single();
      if (!error && data) {
        setTasks((prev) => [data, ...prev]);
        toast({ title: "Task added" });
      }
    }
    setSaving(false);
    setDialogOpen(false);
    setEditing(getEmpty());
  }

  async function deleteTask(id: string) {
    await supabase.from("tasks").delete().eq("id", id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    toast({ title: "Task deleted" });
  }

  function openNew() { setEditing(getEmpty()); setTagInput(""); setDialogOpen(true); }
  function openEdit(task: Task) { setEditing({ ...task }); setTagInput((task.tags ?? []).join(", ")); setDialogOpen(true); }

  function handleTagInput(val: string) {
    setTagInput(val);
    const tags = val.split(",").map((t) => t.trim()).filter(Boolean);
    setEditing((prev) => ({ ...prev, tags }));
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      done: "success", in_progress: "info", not_started: "outline",
    };
    return map[status] ?? "outline";
  };

  const renderTaskGroup = (label: string, items: Task[], accent?: string) => {
    if (!items.length) return null;
    return (
      <div className="space-y-1.5">
        <p className={`text-xs font-semibold uppercase tracking-wider px-1 ${accent ?? "text-muted-foreground"}`}>{label}</p>
        {items.map((task) => (
          <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-secondary/30 transition-colors group">
            <Checkbox
              checked={task.status === "done"}
              onCheckedChange={() => toggleDone(task)}
              className="mt-0.5 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`text-sm font-medium ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                  {task.title}
                </p>
                <Badge variant={statusBadge(task.status) as any} className="text-xs">{task.status.replace("_", " ")}</Badge>
                <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>{task.priority}</Badge>
              </div>
              {task.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {task.due_date && <span className="text-xs text-muted-foreground">{formatDate(task.due_date)}</span>}
                {(task.tags ?? []).map((tag) => (
                  <span key={tag} className="text-xs bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">#{tag}</span>
                ))}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                  <MoreVertical className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEdit(task)}><Edit2 className="w-3.5 h-3.5 mr-2" />Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={() => deleteTask(task.id)} className="text-red-400"><Trash2 className="w-3.5 h-3.5 mr-2" />Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <PageHeader
        icon={CheckSquare}
        title="Tasks"
        description={`${tasks.filter((t) => t.status !== "done").length} remaining`}
        actions={<Button onClick={openNew} size="sm" className="gap-1.5"><Plus className="w-4 h-4" />New Task</Button>}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="not_started">Not started</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priority</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task list */}
      <div className="space-y-6">
        {!filtered.length ? (
          <EmptyState
            icon={CheckSquare}
            title="No tasks found"
            description={tasks.length ? "Try adjusting your filters." : "Add your first task to get started."}
            actionLabel="Add Task"
            onAction={openNew}
          />
        ) : (
          <>
            {renderTaskGroup("Today", todayTasks)}
            {renderTaskGroup("Upcoming", upcomingTasks)}
            {renderTaskGroup("⚠ Overdue", overdueTasks, "text-red-400")}
            {renderTaskGroup("No due date", otherTasks)}
          </>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setDialogOpen(false); setEditing(getEmpty()); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing.id ? "Edit Task" : "New Task"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input placeholder="What needs to be done?" value={editing.title ?? ""} onChange={(e) => setEditing((p) => ({ ...p, title: e.target.value }))} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="Optional notes…" value={editing.description ?? ""} onChange={(e) => setEditing((p) => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={editing.status ?? "not_started"} onValueChange={(v) => setEditing((p) => ({ ...p, status: v as Task["status"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not started</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={editing.priority ?? "medium"} onValueChange={(v) => setEditing((p) => ({ ...p, priority: v as Task["priority"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Due date</Label>
                <Input type="date" value={editing.due_date ?? ""} onChange={(e) => setEditing((p) => ({ ...p, due_date: e.target.value || null }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Due time</Label>
                <Input type="time" value={editing.due_time ?? ""} onChange={(e) => setEditing((p) => ({ ...p, due_time: e.target.value || null }))} />
              </div>
            </div>
            {projects.length > 0 && (
              <div className="space-y-1.5">
                <Label>Project</Label>
                <Select value={editing.project_id ?? "none"} onValueChange={(v) => setEditing((p) => ({ ...p, project_id: v === "none" ? null : v }))}>
                  <SelectTrigger><SelectValue placeholder="Link to project…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Tags (comma separated)</Label>
              <Input placeholder="dev, urgent, review" value={tagInput} onChange={(e) => handleTagInput(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveTask} disabled={saving || !editing.title?.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing.id ? "Save" : "Add Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
