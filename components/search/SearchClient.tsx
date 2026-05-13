"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { Search, CheckSquare, FileText, FolderKanban, Package, Wallet, Target, GraduationCap, Dumbbell, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  href: string;
  badge?: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; href: (id: string) => string }> = {
  task: { icon: CheckSquare, color: "text-blue-400", href: () => "/tasks" },
  note: { icon: FileText, color: "text-yellow-400", href: () => "/notes" },
  project: { icon: FolderKanban, color: "text-purple-400", href: () => "/projects" },
  product: { icon: Package, color: "text-green-400", href: () => "/products" },
  goal: { icon: Target, color: "text-orange-400", href: () => "/goals" },
  topic: { icon: GraduationCap, color: "text-cyan-400", href: () => "/learning" },
  exercise: { icon: Dumbbell, color: "text-red-400", href: () => "/gym" },
};

export function SearchClient({ userId }: { userId: string }) {
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) { setResults([]); return; }
    setLoading(true);

    const searchStr = `%${q}%`;

    const [
      { data: tasks }, { data: notes }, { data: projects },
      { data: products }, { data: goals }, { data: topics },
    ] = await Promise.all([
      supabase.from("tasks").select("id, title, status, priority, due_date").eq("user_id", userId).ilike("title", searchStr).limit(5),
      supabase.from("notes").select("id, title, category, updated_at").eq("user_id", userId).or(`title.ilike.${searchStr},content.ilike.${searchStr}`).limit(5),
      supabase.from("projects").select("id, name, status, progress").eq("user_id", userId).ilike("name", searchStr).limit(5),
      supabase.from("products").select("id, name, brand, category, status").eq("user_id", userId).ilike("name", searchStr).limit(5),
      supabase.from("goals").select("id, title, category, status").eq("user_id", userId).ilike("title", searchStr).limit(5),
      supabase.from("learning_topics").select("id, title, status, path_id").eq("user_id", userId).ilike("title", searchStr).limit(5),
    ]);

    const allResults: SearchResult[] = [
      ...(tasks ?? []).map((t) => ({ id: t.id, type: "task", title: t.title, subtitle: `${t.status} · ${t.priority}${t.due_date ? ` · ${formatDate(t.due_date)}` : ""}`, href: "/tasks", badge: t.priority })),
      ...(notes ?? []).map((n) => ({ id: n.id, type: "note", title: n.title, subtitle: n.category ?? "Note", href: "/notes" })),
      ...(projects ?? []).map((p) => ({ id: p.id, type: "project", title: p.name, subtitle: `${p.status} · ${p.progress}%`, href: "/projects" })),
      ...(products ?? []).map((p) => ({ id: p.id, type: "product", title: p.name, subtitle: `${p.brand ?? ""} · ${p.category}`, href: "/products" })),
      ...(goals ?? []).map((g) => ({ id: g.id, type: "goal", title: g.title, subtitle: `${g.category} · ${g.status}`, href: "/goals" })),
      ...(topics ?? []).map((t) => ({ id: t.id, type: "topic", title: t.title, subtitle: t.status, href: "/learning" })),
    ];

    setResults(allResults);
    setLoading(false);
  }, [supabase, userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    const timer = setTimeout(() => search(val), 300);
    return () => clearTimeout(timer);
  };

  const grouped = results.reduce((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <>
      <PageHeader icon={Search} title="Global Search" description="Search across everything in Sly OS" />

      <div className="relative max-w-2xl mb-6">
        <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
        <Input
          className="pl-10 h-12 text-base"
          placeholder="Search tasks, notes, projects, products, goals…"
          value={query}
          onChange={handleChange}
          autoFocus
        />
        {loading && <Loader2 className="absolute right-3 top-3.5 w-5 h-5 text-muted-foreground animate-spin" />}
      </div>

      {query.length >= 2 && !loading && results.length === 0 && (
        <p className="text-sm text-muted-foreground">No results found for &quot;{query}&quot;</p>
      )}

      {Object.entries(grouped).map(([type, items]) => {
        const config = TYPE_CONFIG[type];
        if (!config) return null;
        const Icon = config.icon;
        return (
          <div key={type} className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${config.color}`} />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider capitalize">{type}s</p>
            </div>
            <div className="space-y-1">
              {items.map((result) => (
                <Link key={result.id} href={result.href} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-secondary/30 transition-colors">
                  <Icon className={`w-4 h-4 shrink-0 ${config.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{result.title}</p>
                    {result.subtitle && <p className="text-xs text-muted-foreground capitalize">{result.subtitle}</p>}
                  </div>
                  {result.badge && <Badge variant="outline" className="text-xs capitalize">{result.badge}</Badge>}
                </Link>
              ))}
            </div>
          </div>
        );
      })}

      {!query && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Start typing to search across tasks, notes, projects, products, goals, and more.</p>
        </div>
      )}
    </>
  );
}
