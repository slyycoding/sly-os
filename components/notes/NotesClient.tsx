"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Note } from "@/lib/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Search, Pin, MoreVertical, Trash2, Edit2, Loader2, PinOff } from "lucide-react";
import { formatRelative } from "@/lib/utils";
import { toast } from "@/lib/hooks/use-toast";

interface NotesClientProps {
  initialNotes: Note[];
  projects: { id: string; name: string }[];
  userId: string;
}

const EMPTY: Partial<Note> = { title: "", content: "", category: null, tags: [], is_pinned: false, project_id: null };

export function NotesClient({ initialNotes, projects, userId }: NotesClientProps) {
  const supabase = createClient();
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Note>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const categories = useMemo(() => {
    const cats = new Set(notes.map((n) => n.category).filter(Boolean));
    return Array.from(cats) as string[];
  }, [notes]);

  const filtered = useMemo(() => {
    return notes.filter((n) => {
      const matchesSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase());
      const matchesCat = categoryFilter === "all" || n.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [notes, search, categoryFilter]);

  const pinned = filtered.filter((n) => n.is_pinned);
  const unpinned = filtered.filter((n) => !n.is_pinned);

  async function saveNote() {
    if (!editing.title?.trim()) return;
    setSaving(true);

    if (editing.id) {
      const { data, error } = await supabase.from("notes").update({
        title: editing.title, content: editing.content ?? "",
        category: editing.category ?? null, tags: editing.tags ?? [],
        is_pinned: editing.is_pinned ?? false, project_id: editing.project_id ?? null,
      }).eq("id", editing.id).select().single();
      if (!error && data) setNotes((prev) => prev.map((n) => n.id === data.id ? data : n));
    } else {
      const { data, error } = await supabase.from("notes").insert({
        user_id: userId, title: editing.title, content: editing.content ?? "",
        category: editing.category ?? null, tags: editing.tags ?? [],
        is_pinned: editing.is_pinned ?? false, project_id: editing.project_id ?? null,
      }).select().single();
      if (!error && data) setNotes((prev) => [data, ...prev]);
    }
    toast({ title: editing.id ? "Note updated" : "Note saved" });
    setSaving(false);
    setDialogOpen(false);
    setEditing(EMPTY);
  }

  async function deleteNote(id: string) {
    await supabase.from("notes").delete().eq("id", id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    toast({ title: "Note deleted" });
  }

  async function togglePin(note: Note) {
    const { data } = await supabase.from("notes").update({ is_pinned: !note.is_pinned }).eq("id", note.id).select().single();
    if (data) setNotes((prev) => prev.map((n) => n.id === data.id ? data : n));
  }

  function openNew() { setEditing(EMPTY); setTagInput(""); setDialogOpen(true); }
  function openEdit(note: Note) { setEditing({ ...note }); setTagInput((note.tags ?? []).join(", ")); setDialogOpen(true); }

  const renderNote = (note: Note) => (
    <Card key={note.id} className="hover:border-border/80 transition-colors cursor-pointer group" onClick={() => openEdit(note)}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {note.is_pinned && <Pin className="w-3 h-3 text-yellow-400 shrink-0" />}
              <h3 className="text-sm font-medium truncate">{note.title}</h3>
            </div>
            {note.content && <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{note.content}</p>}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {note.category && <Badge variant="outline" className="text-xs">{note.category}</Badge>}
              {(note.tags ?? []).map((tag) => <span key={tag} className="text-xs bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">#{tag}</span>)}
            </div>
            <p className="text-[10px] text-muted-foreground/60 mt-1">{formatRelative(note.updated_at)}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0" onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(note); }}><Edit2 className="w-3.5 h-3.5 mr-2" />Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); togglePin(note); }}>
                {note.is_pinned ? <><PinOff className="w-3.5 h-3.5 mr-2" />Unpin</> : <><Pin className="w-3.5 h-3.5 mr-2" />Pin</>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }} className="text-red-400"><Trash2 className="w-3.5 h-3.5 mr-2" />Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <PageHeader
        icon={FileText}
        title="Notes"
        description={`${notes.length} notes`}
        actions={<Button size="sm" onClick={openNew} className="gap-1.5"><Plus className="w-4 h-4" />New Note</Button>}
      />

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search notes…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!filtered.length ? (
        <EmptyState icon={FileText} title="No notes" description={notes.length ? "No notes match your search." : "Create your first note."} actionLabel="New Note" onAction={openNew} />
      ) : (
        <div className="space-y-4">
          {pinned.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pinned</p>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{pinned.map(renderNote)}</div>
            </div>
          )}
          {unpinned.length > 0 && (
            <div>
              {pinned.length > 0 && <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notes</p>}
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{unpinned.map(renderNote)}</div>
            </div>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setDialogOpen(false); setEditing(EMPTY); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing.id ? "Edit Note" : "New Note"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Title *</Label><Input placeholder="Note title" value={editing.title ?? ""} onChange={(e) => setEditing((p) => ({ ...p, title: e.target.value }))} autoFocus /></div>
            <div className="space-y-1.5"><Label>Content</Label><Textarea placeholder="Write your note here…" value={editing.content ?? ""} onChange={(e) => setEditing((p) => ({ ...p, content: e.target.value }))} rows={6} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5"><Label>Category</Label><Input placeholder="e.g. Ideas, Dev, Health" value={editing.category ?? ""} onChange={(e) => setEditing((p) => ({ ...p, category: e.target.value || null }))} /></div>
              <div className="space-y-1.5">
                <Label>Tags</Label>
                <Input placeholder="tag1, tag2" value={tagInput} onChange={(e) => { setTagInput(e.target.value); setEditing((p) => ({ ...p, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })); }} />
              </div>
            </div>
            {projects.length > 0 && (
              <div className="space-y-1.5">
                <Label>Link to project</Label>
                <Select value={editing.project_id ?? "none"} onValueChange={(v) => setEditing((p) => ({ ...p, project_id: v === "none" ? null : v }))}>
                  <SelectTrigger><SelectValue placeholder="No project" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveNote} disabled={saving || !editing.title?.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing.id ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
