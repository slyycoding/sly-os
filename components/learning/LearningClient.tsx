"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LearningPath, LearningTopic, LearningResource, StudySession, Certificate, TopicStatus } from "@/lib/types";
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
import {
  GraduationCap, Plus, MoreVertical, Trash2, Edit2, Loader2, BookOpen,
  CheckCircle, Clock, RotateCcw, ArrowRight, Trophy, Zap,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "@/lib/hooks/use-toast";
import { format } from "date-fns";

interface LearningClientProps {
  initialPaths: LearningPath[];
  initialTopics: LearningTopic[];
  initialResources: LearningResource[];
  initialSessions: StudySession[];
  initialCertificates: Certificate[];
  userId: string;
}

const TOPIC_STATUS_CONFIG: Record<TopicStatus, { label: string; icon: React.ElementType; color: string }> = {
  not_started: { label: "Not Started", icon: Clock, color: "text-zinc-400" },
  learning: { label: "Learning", icon: BookOpen, color: "text-blue-400" },
  completed: { label: "Completed", icon: CheckCircle, color: "text-green-400" },
  needs_revision: { label: "Needs Revision", icon: RotateCcw, color: "text-yellow-400" },
};

const PATH_COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

export function LearningClient({ initialPaths, initialTopics, initialResources, initialSessions, initialCertificates, userId }: LearningClientProps) {
  const supabase = createClient();
  const [paths, setPaths] = useState<LearningPath[]>(initialPaths);
  const [topics, setTopics] = useState<LearningTopic[]>(initialTopics);
  const [sessions, setSessions] = useState<StudySession[]>(initialSessions);
  const [certificates, setCertificates] = useState<Certificate[]>(initialCertificates);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(paths[0]?.id ?? null);
  const [pathDialogOpen, setPathDialogOpen] = useState(false);
  const [topicDialogOpen, setTopicDialogOpen] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [certDialogOpen, setCertDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pathForm, setPathForm] = useState({ name: "", description: "", icon: "📚", color: "#ef4444" });
  const [topicForm, setTopicForm] = useState({ title: "", description: "", status: "not_started" as TopicStatus, priority: "medium", estimated_hours: "", due_date: "", notes: "" });
  const [sessionForm, setSessionForm] = useState({ duration_minutes: "", notes: "", topic_id: "" });
  const [certForm, setCertForm] = useState({ name: "", issuer: "", issue_date: "", credential_url: "" });
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);

  const selectedPath = paths.find((p) => p.id === selectedPathId);
  const pathTopics = topics.filter((t) => t.path_id === selectedPathId);
  const pathSessions = sessions.filter((s) => s.path_id === selectedPathId);

  const topicsByStatus = useMemo(() => ({
    not_started: pathTopics.filter((t) => t.status === "not_started"),
    learning: pathTopics.filter((t) => t.status === "learning"),
    completed: pathTopics.filter((t) => t.status === "completed"),
    needs_revision: pathTopics.filter((t) => t.status === "needs_revision"),
  }), [pathTopics]);

  const nextTopic = pathTopics.filter((t) => t.status !== "completed").sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 1) - (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 1);
  })[0];

  const totalStudyMinutes = pathSessions.reduce((s, sess) => s + (sess.duration_minutes ?? 0), 0);

  async function createPath() {
    if (!pathForm.name.trim()) return;
    setSaving(true);
    const { data } = await supabase.from("learning_paths").insert({
      user_id: userId, name: pathForm.name, description: pathForm.description || null,
      icon: pathForm.icon, color: pathForm.color, progress: 0, is_active: true,
    }).select().single();
    setSaving(false);
    if (data) { setPaths((prev) => [...prev, data]); setSelectedPathId(data.id); }
    toast({ title: "Learning path created!" });
    setPathDialogOpen(false);
    setPathForm({ name: "", description: "", icon: "📚", color: "#ef4444" });
  }

  async function createTopic() {
    if (!topicForm.title.trim() || !selectedPathId) return;
    setSaving(true);
    const payload = {
      path_id: selectedPathId, user_id: userId, title: topicForm.title,
      description: topicForm.description || null,
      status: topicForm.status, priority: topicForm.priority as LearningTopic["priority"],
      estimated_hours: topicForm.estimated_hours ? parseFloat(topicForm.estimated_hours) : null,
      due_date: topicForm.due_date || null, notes: topicForm.notes || null,
      order_index: pathTopics.length,
    };

    if (editingTopicId) {
      const { data } = await supabase.from("learning_topics").update(payload).eq("id", editingTopicId).select().single();
      if (data) setTopics((prev) => prev.map((t) => t.id === data.id ? data : t));
    } else {
      const { data } = await supabase.from("learning_topics").insert(payload).select().single();
      if (data) setTopics((prev) => [...prev, data]);
    }

    // Update path progress
    const updatedTopics = editingTopicId
      ? pathTopics.map((t) => t.id === editingTopicId ? { ...t, status: topicForm.status } : t)
      : [...pathTopics, { status: topicForm.status }];
    const completedCount = updatedTopics.filter((t) => t.status === "completed").length;
    const progress = updatedTopics.length ? Math.round((completedCount / updatedTopics.length) * 100) : 0;
    await supabase.from("learning_paths").update({ progress }).eq("id", selectedPathId);
    setPaths((prev) => prev.map((p) => p.id === selectedPathId ? { ...p, progress } : p));

    setSaving(false);
    toast({ title: editingTopicId ? "Topic updated" : "Topic added!" });
    setTopicDialogOpen(false);
    setEditingTopicId(null);
    setTopicForm({ title: "", description: "", status: "not_started", priority: "medium", estimated_hours: "", due_date: "", notes: "" });
  }

  async function updateTopicStatus(topicId: string, status: TopicStatus) {
    const { data } = await supabase.from("learning_topics").update({ status, completed_date: status === "completed" ? format(new Date(), "yyyy-MM-dd") : null }).eq("id", topicId).select().single();
    if (data) {
      const updatedTopics = topics.map((t) => t.id === data.id ? data : t);
      setTopics(updatedTopics);
      if (selectedPathId) {
        const pathT = updatedTopics.filter((t) => t.path_id === selectedPathId);
        const completedCount = pathT.filter((t) => t.status === "completed").length;
        const progress = pathT.length ? Math.round((completedCount / pathT.length) * 100) : 0;
        await supabase.from("learning_paths").update({ progress }).eq("id", selectedPathId);
        setPaths((prev) => prev.map((p) => p.id === selectedPathId ? { ...p, progress } : p));
      }
    }
  }

  async function logSession() {
    if (!selectedPathId) return;
    setSaving(true);
    const { data } = await supabase.from("study_sessions").insert({
      user_id: userId, path_id: selectedPathId,
      topic_id: sessionForm.topic_id || null,
      start_time: new Date().toISOString(),
      duration_minutes: sessionForm.duration_minutes ? parseInt(sessionForm.duration_minutes) : null,
      notes: sessionForm.notes || null,
    }).select().single();
    setSaving(false);
    if (data) setSessions((prev) => [data, ...prev]);
    toast({ title: "Study session logged!" });
    setSessionDialogOpen(false);
    setSessionForm({ duration_minutes: "", notes: "", topic_id: "" });
  }

  async function deletePath(id: string) {
    await supabase.from("learning_paths").delete().eq("id", id);
    setPaths((prev) => prev.filter((p) => p.id !== id));
    if (selectedPathId === id) setSelectedPathId(paths.find((p) => p.id !== id)?.id ?? null);
    toast({ title: "Path deleted" });
  }

  const openEditTopic = (topic: LearningTopic) => {
    setTopicForm({
      title: topic.title, description: topic.description ?? "",
      status: topic.status, priority: topic.priority,
      estimated_hours: topic.estimated_hours?.toString() ?? "",
      due_date: topic.due_date ?? "", notes: topic.notes ?? "",
    });
    setEditingTopicId(topic.id);
    setTopicDialogOpen(true);
  };

  const STATUS_COLUMNS: { status: TopicStatus; label: string; color: string }[] = [
    { status: "not_started", label: "Not Started", color: "border-zinc-500/30" },
    { status: "learning", label: "Learning", color: "border-blue-500/30" },
    { status: "completed", label: "Completed", color: "border-green-500/30" },
    { status: "needs_revision", label: "Needs Revision", color: "border-yellow-500/30" },
  ];

  return (
    <>
      <PageHeader
        icon={GraduationCap}
        title="Learning Stack"
        description="Study roadmap and progress tracker"
        actions={
          <div className="flex gap-2">
            {selectedPathId && (
              <>
                <Button variant="outline" size="sm" onClick={() => setSessionDialogOpen(true)} className="gap-1.5"><Clock className="w-4 h-4" />Log Session</Button>
                <Button size="sm" onClick={() => { setEditingTopicId(null); setTopicDialogOpen(true); }} className="gap-1.5"><Plus className="w-4 h-4" />Topic</Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => setPathDialogOpen(true)} className="gap-1.5"><Plus className="w-4 h-4" />Path</Button>
          </div>
        }
      />

      {!paths.length ? (
        <EmptyState icon={GraduationCap} title="No learning paths" description="Create your first learning path to get started." actionLabel="Create Path" onAction={() => setPathDialogOpen(true)} />
      ) : (
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* Sidebar: path list */}
          <div className="lg:w-56 shrink-0 space-y-2">
            {paths.map((path) => (
              <button
                key={path.id}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedPathId === path.id ? "border-border bg-secondary" : "border-transparent hover:border-border hover:bg-secondary/50"}`}
                onClick={() => setSelectedPathId(path.id)}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-medium truncate">{path.icon} {path.name}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => e.stopPropagation()}><MoreVertical className="w-3 h-3" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deletePath(path.id); }} className="text-red-400"><Trash2 className="w-3.5 h-3.5 mr-2" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Progress value={path.progress} className="h-1 mt-2" />
                <p className="text-xs text-muted-foreground mt-1">{path.progress}% complete</p>
              </button>
            ))}

            {certificates.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Certificates</p>
                {certificates.map((cert) => (
                  <div key={cert.id} className="flex items-center gap-2 p-2 rounded text-xs">
                    <Trophy className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                    <span className="truncate">{cert.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {selectedPath && (
              <>
                {/* Path header */}
                <div className="flex items-start justify-between mb-4 p-4 rounded-lg border border-border bg-card">
                  <div>
                    <h2 className="text-base font-bold">{selectedPath.icon} {selectedPath.name}</h2>
                    {selectedPath.description && <p className="text-sm text-muted-foreground">{selectedPath.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{pathTopics.length} topics</span>
                      <span>{topicsByStatus.completed.length} completed</span>
                      <span>{Math.round(totalStudyMinutes / 60)}h studied</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{selectedPath.progress}%</p>
                    <p className="text-xs text-muted-foreground">complete</p>
                  </div>
                </div>

                {/* Next to study */}
                {nextTopic && (
                  <div className="mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/5 flex items-center gap-3">
                    <Zap className="w-4 h-4 text-red-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Next up</p>
                      <p className="text-sm font-medium">{nextTopic.title}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => updateTopicStatus(nextTopic.id, "learning")}>
                      Start <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                )}

                <Tabs defaultValue="kanban">
                  <TabsList className="mb-4">
                    <TabsTrigger value="kanban">Kanban</TabsTrigger>
                    <TabsTrigger value="list">List</TabsTrigger>
                    <TabsTrigger value="sessions">Sessions</TabsTrigger>
                  </TabsList>

                  {/* Kanban view */}
                  <TabsContent value="kanban">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {STATUS_COLUMNS.map(({ status, label, color }) => (
                        <div key={status} className={`rounded-lg border ${color} bg-card p-3`}>
                          <div className="flex items-center gap-1.5 mb-3">
                            {(() => { const cfg = TOPIC_STATUS_CONFIG[status]; return <cfg.icon className={`w-3.5 h-3.5 ${cfg.color}`} />; })()}
                            <p className="text-xs font-semibold">{label}</p>
                            <Badge variant="outline" className="text-xs ml-auto">{topicsByStatus[status].length}</Badge>
                          </div>
                          <div className="space-y-2">
                            {topicsByStatus[status].map((topic) => (
                              <div key={topic.id} className="p-2.5 rounded-md bg-secondary/50 border border-border group cursor-pointer hover:bg-secondary" onClick={() => openEditTopic(topic)}>
                                <p className="text-xs font-medium line-clamp-2">{topic.title}</p>
                                {topic.estimated_hours && <p className="text-[10px] text-muted-foreground mt-1">{topic.estimated_hours}h est.</p>}
                                {topic.due_date && <p className="text-[10px] text-muted-foreground">{formatDate(topic.due_date)}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* List view */}
                  <TabsContent value="list">
                    {!pathTopics.length ? (
                      <EmptyState icon={BookOpen} title="No topics" description="Add topics to this learning path." actionLabel="Add Topic" onAction={() => setTopicDialogOpen(true)} />
                    ) : (
                      <div className="space-y-2">
                        {pathTopics.map((topic) => {
                          const cfg = TOPIC_STATUS_CONFIG[topic.status];
                          return (
                            <div key={topic.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-secondary/20 group">
                              <cfg.icon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{topic.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge variant="outline" className="text-xs">{topic.priority}</Badge>
                                  {topic.estimated_hours && <span className="text-xs text-muted-foreground">{topic.estimated_hours}h</span>}
                                  {topic.due_date && <span className="text-xs text-muted-foreground">Due {formatDate(topic.due_date)}</span>}
                                </div>
                              </div>
                              <Select value={topic.status} onValueChange={(v) => updateTopicStatus(topic.id, v as TopicStatus)}>
                                <SelectTrigger className="w-36 h-7 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {(Object.keys(TOPIC_STATUS_CONFIG) as TopicStatus[]).map((s) => (
                                    <SelectItem key={s} value={s} className="text-xs">{TOPIC_STATUS_CONFIG[s].label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => openEditTopic(topic)}>
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>

                  {/* Sessions */}
                  <TabsContent value="sessions">
                    <div className="space-y-2">
                      {!pathSessions.length ? (
                        <EmptyState icon={Clock} title="No study sessions" description="Log your study sessions to track time." actionLabel="Log Session" onAction={() => setSessionDialogOpen(true)} />
                      ) : (
                        pathSessions.map((s) => (
                          <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                            <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm">{s.duration_minutes ? `${s.duration_minutes} min session` : "Session"}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(s.start_time), "MMM d, h:mm a")}</p>
                              {s.notes && <p className="text-xs text-muted-foreground">{s.notes}</p>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </div>
      )}

      {/* Create Path Dialog */}
      <Dialog open={pathDialogOpen} onOpenChange={setPathDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New Learning Path</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Name *</Label><Input placeholder="Cybersecurity, Web Dev…" value={pathForm.name} onChange={(e) => setPathForm((f) => ({ ...f, name: e.target.value }))} autoFocus /></div>
            <div className="space-y-1.5"><Label>Description</Label><Input placeholder="What will you learn?" value={pathForm.description} onChange={(e) => setPathForm((f) => ({ ...f, description: e.target.value }))} /></div>
            <div className="space-y-1.5">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {["📚", "🔐", "💻", "🌐", "🐧", "☁️", "🐍", "🌩️", "🛡️", "⚡"].map((icon) => (
                  <button key={icon} className={`w-9 h-9 rounded-lg border text-lg transition-colors ${pathForm.icon === icon ? "border-primary bg-primary/20" : "border-border hover:border-foreground"}`} onClick={() => setPathForm((f) => ({ ...f, icon }))}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex gap-2">
                {PATH_COLORS.map((c) => <button key={c} className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${pathForm.color === c ? "border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} onClick={() => setPathForm((f) => ({ ...f, color: c }))} />)}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPathDialogOpen(false)}>Cancel</Button>
            <Button onClick={createPath} disabled={saving || !pathForm.name.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Topic Dialog */}
      <Dialog open={topicDialogOpen} onOpenChange={(o) => { if (!o) { setTopicDialogOpen(false); setEditingTopicId(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingTopicId ? "Edit Topic" : "Add Topic"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Title *</Label><Input placeholder="Topic name" value={topicForm.title} onChange={(e) => setTopicForm((f) => ({ ...f, title: e.target.value }))} autoFocus /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea placeholder="What does this cover?" value={topicForm.description} onChange={(e) => setTopicForm((f) => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={topicForm.status} onValueChange={(v) => setTopicForm((f) => ({ ...f, status: v as TopicStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TOPIC_STATUS_CONFIG) as TopicStatus[]).map((s) => <SelectItem key={s} value={s}>{TOPIC_STATUS_CONFIG[s].label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={topicForm.priority} onValueChange={(v) => setTopicForm((f) => ({ ...f, priority: v }))}>
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
              <div className="space-y-1.5"><Label>Est. hours</Label><Input type="number" step="0.5" placeholder="2.5" value={topicForm.estimated_hours} onChange={(e) => setTopicForm((f) => ({ ...f, estimated_hours: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Due date</Label><Input type="date" value={topicForm.due_date} onChange={(e) => setTopicForm((f) => ({ ...f, due_date: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Notes</Label><Textarea placeholder="Notes for this topic…" value={topicForm.notes} onChange={(e) => setTopicForm((f) => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTopicDialogOpen(false)}>Cancel</Button>
            <Button onClick={createTopic} disabled={saving || !topicForm.title.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingTopicId ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Session Dialog */}
      <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Log Study Session</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Duration (minutes)</Label><Input type="number" placeholder="60" value={sessionForm.duration_minutes} onChange={(e) => setSessionForm((f) => ({ ...f, duration_minutes: e.target.value }))} autoFocus /></div>
            <div className="space-y-1.5">
              <Label>Topic (optional)</Label>
              <Select value={sessionForm.topic_id || "none"} onValueChange={(v) => setSessionForm((f) => ({ ...f, topic_id: v === "none" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Select topic…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific topic</SelectItem>
                  {pathTopics.map((t) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Notes</Label><Textarea placeholder="What did you cover?" value={sessionForm.notes} onChange={(e) => setSessionForm((f) => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSessionDialogOpen(false)}>Cancel</Button>
            <Button onClick={logSession} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
