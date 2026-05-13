"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Project, ProjectLog, ProjectMilestone } from "@/lib/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FolderKanban, Plus, MoreVertical, Trash2, Edit2, Loader2, Clock, BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import { formatDate, getPriorityColor, getStatusColor } from "@/lib/utils";
import { toast } from "@/lib/hooks/use-toast";

interface ProjectsClientProps {
  initialProjects: Project[];
  milestones: ProjectMilestone[];
  logs: ProjectLog[];
  userId: string;
}

const COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

const EMPTY_PROJECT: Partial<Project> = {
  name: "", description: "", status: "planning", priority: "medium",
  progress: 0, deadline: null, client: null, project_type: null, color: "#ef4444",
};

export function ProjectsClient({ initialProjects, milestones, logs, userId }: ProjectsClientProps) {
  const supabase = createClient();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [projectLogs, setProjectLogs] = useState<ProjectLog[]>(logs);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Project>>(EMPTY_PROJECT);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [logForm, setLogForm] = useState({ title: "", update: "", blockers: "", next_steps: "" });

  const statusGroups = {
    active: projects.filter((p) => p.status === "active"),
    planning: projects.filter((p) => p.status === "planning"),
    on_hold: projects.filter((p) => p.status === "on_hold"),
    completed: projects.filter((p) => p.status === "completed"),
    cancelled: projects.filter((p) => p.status === "cancelled"),
  };

  async function saveProject() {
    if (!editing.name?.trim()) return;
    setSaving(true);

    if (editing.id) {
      const { data, error } = await supabase.from("projects").update({
        name: editing.name, description: editing.description ?? null,
        status: editing.status, priority: editing.priority,
        progress: editing.progress ?? 0, deadline: editing.deadline ?? null,
        client: editing.client ?? null, project_type: editing.project_type ?? null,
        color: editing.color ?? "#ef4444",
      }).eq("id", editing.id).select().single();
      if (!error && data) setProjects((prev) => prev.map((p) => p.id === data.id ? data : p));
    } else {
      const { data, error } = await supabase.from("projects").insert({
        user_id: userId, name: editing.name, description: editing.description ?? null,
        status: (editing.status as Project["status"]) ?? "planning",
        priority: (editing.priority as Project["priority"]) ?? "medium",
        progress: editing.progress ?? 0, deadline: editing.deadline ?? null,
        client: editing.client ?? null, project_type: editing.project_type ?? null,
        color: editing.color ?? "#ef4444",
      }).select().single();
      if (!error && data) setProjects((prev) => [data, ...prev]);
    }
    toast({ title: editing.id ? "Project updated" : "Project created" });
    setSaving(false);
    setDialogOpen(false);
    setEditing(EMPTY_PROJECT);
  }

  async function deleteProject(id: string) {
    await supabase.from("projects").delete().eq("id", id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    toast({ title: "Project deleted" });
  }

  async function addLog() {
    if (!logForm.title.trim() || !selectedProject) return;
    setSaving(true);
    const { data, error } = await supabase.from("project_logs").insert({
      user_id: userId, project_id: selectedProject.id,
      title: logForm.title, update: logForm.update,
      blockers: logForm.blockers || null, next_steps: logForm.next_steps || null,
      log_date: new Date().toISOString().split("T")[0],
    }).select().single();
    setSaving(false);
    if (!error && data) {
      setProjectLogs((prev) => [data, ...prev]);
      toast({ title: "Log added" });
    }
    setLogDialogOpen(false);
    setLogForm({ title: "", update: "", blockers: "", next_steps: "" });
  }

  const renderProjectCard = (project: Project) => {
    const projLogs = projectLogs.filter((l) => l.project_id === project.id);
    const projMilestones = milestones.filter((m) => m.project_id === project.id);
    const isExpanded = expandedId === project.id;

    return (
      <Card key={project.id} className="overflow-hidden">
        <div className="h-1" style={{ backgroundColor: project.color }} />
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm">{project.name}</h3>
                <Badge variant="outline" className={`text-xs ${getStatusColor(project.status)}`}>
                  {project.status.replace("_", " ")}
                </Badge>
                <Badge variant="outline" className={`text-xs ${getPriorityColor(project.priority)}`}>
                  {project.priority}
                </Badge>
              </div>
              {project.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>}
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                {project.deadline && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(project.deadline)}</span>}
                {project.client && <span>{project.client}</span>}
                {project.project_type && <span className="bg-secondary px-1.5 py-0.5 rounded">{project.project_type}</span>}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"><MoreVertical className="w-3.5 h-3.5" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setEditing(project); setDialogOpen(true); }}><Edit2 className="w-3.5 h-3.5 mr-2" />Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSelectedProject(project); setLogDialogOpen(true); }}><BookOpen className="w-3.5 h-3.5 mr-2" />Add Log</DropdownMenuItem>
                <DropdownMenuItem onClick={() => deleteProject(project.id)} className="text-red-400"><Trash2 className="w-3.5 h-3.5 mr-2" />Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Progress value={project.progress} className="flex-1 h-1.5" />
            <span className="text-xs text-muted-foreground shrink-0">{project.progress}%</span>
          </div>
        </CardHeader>

        {(projLogs.length > 0 || projMilestones.length > 0) && (
          <>
            <button
              className="w-full px-6 py-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 border-t border-border bg-secondary/20"
              onClick={() => setExpandedId(isExpanded ? null : project.id)}
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              {projLogs.length} logs · {projMilestones.length} milestones
            </button>

            {isExpanded && (
              <CardContent className="pt-0 space-y-3">
                {projMilestones.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">Milestones</p>
                    <div className="space-y-1">
                      {projMilestones.map((m) => (
                        <div key={m.id} className="flex items-center gap-2 text-xs">
                          <div className={`w-4 h-4 rounded flex items-center justify-center ${m.completed ? "bg-green-500/20 text-green-400" : "border border-border"}`}>
                            {m.completed ? "✓" : ""}
                          </div>
                          <span className={m.completed ? "text-muted-foreground line-through" : ""}>{m.title}</span>
                          {m.due_date && <span className="text-muted-foreground ml-auto">{formatDate(m.due_date)}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {projLogs.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">Recent Logs</p>
                    <div className="space-y-2">
                      {projLogs.slice(0, 3).map((log) => (
                        <div key={log.id} className="text-xs border-l-2 border-border pl-2">
                          <p className="font-medium">{log.title}</p>
                          <p className="text-muted-foreground">{log.update}</p>
                          {log.blockers && <p className="text-red-400 mt-0.5">⚠ {log.blockers}</p>}
                          {log.next_steps && <p className="text-blue-400 mt-0.5">→ {log.next_steps}</p>}
                          <p className="text-muted-foreground/60 mt-0.5">{formatDate(log.log_date)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </>
        )}
      </Card>
    );
  };

  return (
    <>
      <PageHeader
        icon={FolderKanban}
        title="Projects"
        description={`${projects.length} total · ${statusGroups.active.length} active`}
        actions={<Button size="sm" onClick={() => { setEditing(EMPTY_PROJECT); setDialogOpen(true); }} className="gap-1.5"><Plus className="w-4 h-4" />New Project</Button>}
      />

      {!projects.length ? (
        <EmptyState icon={FolderKanban} title="No projects yet" description="Create your first project to track your work." actionLabel="New Project" onAction={() => setDialogOpen(true)} />
      ) : (
        <Tabs defaultValue="active">
          <TabsList className="mb-4">
            <TabsTrigger value="active">Active ({statusGroups.active.length})</TabsTrigger>
            <TabsTrigger value="planning">Planning ({statusGroups.planning.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({statusGroups.completed.length})</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          {(["active", "planning", "completed"] as const).map((status) => (
            <TabsContent key={status} value={status}>
              {statusGroups[status].length ? (
                <div className="grid gap-4 md:grid-cols-2">{statusGroups[status].map(renderProjectCard)}</div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">No {status} projects.</p>
              )}
            </TabsContent>
          ))}
          <TabsContent value="all">
            <div className="grid gap-4 md:grid-cols-2">{projects.map(renderProjectCard)}</div>
          </TabsContent>
        </Tabs>
      )}

      {/* Project Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setDialogOpen(false); setEditing(EMPTY_PROJECT); } }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing.id ? "Edit Project" : "New Project"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Name *</Label><Input placeholder="Project name" value={editing.name ?? ""} onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))} autoFocus /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea placeholder="What is this project about?" value={editing.description ?? ""} onChange={(e) => setEditing((p) => ({ ...p, description: e.target.value }))} rows={2} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={editing.status ?? "planning"} onValueChange={(v) => setEditing((p) => ({ ...p, status: v as Project["status"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["planning", "active", "on_hold", "completed", "cancelled"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={editing.priority ?? "medium"} onValueChange={(v) => setEditing((p) => ({ ...p, priority: v as Project["priority"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["low", "medium", "high"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5"><Label>Client</Label><Input placeholder="Client name" value={editing.client ?? ""} onChange={(e) => setEditing((p) => ({ ...p, client: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Type</Label><Input placeholder="Web design, Study…" value={editing.project_type ?? ""} onChange={(e) => setEditing((p) => ({ ...p, project_type: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5"><Label>Progress (%)</Label><Input type="number" min={0} max={100} value={editing.progress ?? 0} onChange={(e) => setEditing((p) => ({ ...p, progress: parseInt(e.target.value) || 0 }))} /></div>
              <div className="space-y-1.5"><Label>Deadline</Label><Input type="date" value={editing.deadline ?? ""} onChange={(e) => setEditing((p) => ({ ...p, deadline: e.target.value || null }))} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button key={c} className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${editing.color === c ? "border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} onClick={() => setEditing((p) => ({ ...p, color: c }))} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveProject} disabled={saving || !editing.name?.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing.id ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Dialog */}
      <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Log — {selectedProject?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Title *</Label><Input placeholder="What happened?" value={logForm.title} onChange={(e) => setLogForm((f) => ({ ...f, title: e.target.value }))} autoFocus /></div>
            <div className="space-y-1.5"><Label>Update *</Label><Textarea placeholder="Describe the update…" value={logForm.update} onChange={(e) => setLogForm((f) => ({ ...f, update: e.target.value }))} rows={3} /></div>
            <div className="space-y-1.5"><Label>Blockers</Label><Input placeholder="Any blockers?" value={logForm.blockers} onChange={(e) => setLogForm((f) => ({ ...f, blockers: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Next steps</Label><Input placeholder="What's next?" value={logForm.next_steps} onChange={(e) => setLogForm((f) => ({ ...f, next_steps: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogDialogOpen(false)}>Cancel</Button>
            <Button onClick={addLog} disabled={saving || !logForm.title.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Log"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
