"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SkincareLog } from "@/lib/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sparkles, Plus, Sun, Moon, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/lib/hooks/use-toast";

const DEFAULT_AM_PRODUCTS = ["CeraVe Cleanser", "Niacinamide", "Moisturiser", "SPF 50"];
const DEFAULT_PM_PRODUCTS = ["Oil Cleanser", "CeraVe Cleanser", "Tretinoin/Retinol", "Moisturiser", "Eye cream"];

interface SkincareClientProps {
  initialLogs: SkincareLog[];
  userId: string;
}

interface LogForm {
  log_date: string;
  time_of_day: "morning" | "night";
  products_used: string[];
  skin_condition: string;
  irritation_level: number;
  breakouts: boolean;
  notes: string;
}

export function SkincareClient({ initialLogs, userId }: SkincareClientProps) {
  const supabase = createClient();
  const [logs, setLogs] = useState<SkincareLog[]>(initialLogs);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<LogForm>({
    log_date: format(new Date(), "yyyy-MM-dd"), time_of_day: "morning",
    products_used: [], skin_condition: "", irritation_level: 1, breakouts: false, notes: "",
  });
  const [customProduct, setCustomProduct] = useState("");

  const today = format(new Date(), "yyyy-MM-dd");
  const todayLogs = logs.filter((l) => l.log_date === today);
  const amDone = todayLogs.some((l) => l.time_of_day === "morning");
  const pmDone = todayLogs.some((l) => l.time_of_day === "night");

  const stats = useMemo(() => {
    const last30 = logs.filter((l) => {
      const d = new Date(l.log_date);
      const thirtyAgo = new Date();
      thirtyAgo.setDate(thirtyAgo.getDate() - 30);
      return d >= thirtyAgo;
    });
    const breakoutDays = last30.filter((l) => l.breakouts).length;
    const avgIrritation = last30.length ? (last30.reduce((sum, l) => sum + (l.irritation_level ?? 1), 0) / last30.length).toFixed(1) : "—";
    return { completedDays: new Set(last30.map((l) => l.log_date)).size, breakoutDays, avgIrritation, totalLogs: logs.length };
  }, [logs]);

  function toggleProduct(product: string) {
    setForm((prev) => ({
      ...prev,
      products_used: prev.products_used.includes(product)
        ? prev.products_used.filter((p) => p !== product)
        : [...prev.products_used, product],
    }));
  }

  function addCustomProduct() {
    if (!customProduct.trim()) return;
    setForm((prev) => ({ ...prev, products_used: [...prev.products_used, customProduct.trim()] }));
    setCustomProduct("");
  }

  async function saveLog() {
    setSaving(true);
    const { data, error } = await supabase.from("skincare_logs").insert({
      user_id: userId, log_date: form.log_date,
      time_of_day: form.time_of_day, products_used: form.products_used,
      skin_condition: form.skin_condition || null,
      irritation_level: form.irritation_level,
      breakouts: form.breakouts, notes: form.notes || null,
    }).select().single();
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    if (data) setLogs((prev) => [data, ...prev]);
    toast({ title: "Skincare logged!" });
    setDialogOpen(false);
    setForm({ log_date: format(new Date(), "yyyy-MM-dd"), time_of_day: "morning", products_used: [], skin_condition: "", irritation_level: 1, breakouts: false, notes: "" });
  }

  const defaultProducts = form.time_of_day === "morning" ? DEFAULT_AM_PRODUCTS : DEFAULT_PM_PRODUCTS;

  return (
    <>
      <PageHeader
        icon={Sparkles}
        title="Skincare Tracker"
        description="Track your AM/PM routines"
        actions={<Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5"><Plus className="w-4 h-4" />Log Routine</Button>}
      />

      {/* Today status */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[{ label: "Morning", icon: Sun, done: amDone, color: "text-yellow-400", bg: "bg-yellow-500/10" },
          { label: "Night", icon: Moon, done: pmDone, color: "text-purple-400", bg: "bg-purple-500/10" }].map(({ label, icon: Icon, done, color, bg }) => (
          <Card key={label} className={done ? "border-green-500/30" : ""}>
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}><Icon className={`w-5 h-5 ${color}`} /></div>
              <div>
                <p className="text-sm font-medium">{label} Routine</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {done ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />}
                  <span className={`text-xs ${done ? "text-green-400" : "text-muted-foreground"}`}>{done ? "Done today" : "Not logged"}</span>
                </div>
              </div>
              {!done && <Button variant="outline" size="sm" className="ml-auto" onClick={() => { setForm((f) => ({ ...f, time_of_day: label.toLowerCase() as "morning" | "night", log_date: today })); setDialogOpen(true); }}>Log</Button>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Days tracked (30d)</p><p className="text-xl font-bold mt-1">{stats.completedDays}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Total logs</p><p className="text-xl font-bold mt-1">{stats.totalLogs}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Breakout days (30d)</p><p className="text-xl font-bold mt-1 text-red-400">{stats.breakoutDays}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Avg irritation</p><p className="text-xl font-bold mt-1">{stats.avgIrritation}/5</p></CardContent></Card>
      </div>

      {/* Recent logs */}
      {!logs.length ? (
        <EmptyState icon={Sparkles} title="No skincare logs" description="Start tracking your daily routines." actionLabel="Log Routine" onAction={() => setDialogOpen(true)} />
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Logs</p>
          {logs.slice(0, 20).map((log) => (
            <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-secondary/20">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${log.time_of_day === "morning" ? "bg-yellow-500/10" : "bg-purple-500/10"}`}>
                {log.time_of_day === "morning" ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-purple-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium capitalize">{log.time_of_day} routine</span>
                  <span className="text-xs text-muted-foreground">{format(new Date(log.log_date), "MMM d")}</span>
                  {log.breakouts && <Badge variant="danger" className="text-xs">Breakout</Badge>}
                  {log.irritation_level && log.irritation_level > 2 && <Badge variant="warning" className="text-xs">Irritation {log.irritation_level}/5</Badge>}
                </div>
                {log.products_used?.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {log.products_used.map((p) => <span key={p} className="text-xs bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{p}</span>)}
                  </div>
                )}
                {log.skin_condition && <p className="text-xs text-muted-foreground mt-1">{log.skin_condition}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Log Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) setDialogOpen(false); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Log Skincare Routine</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.log_date} onChange={(e) => setForm((f) => ({ ...f, log_date: e.target.value }))} /></div>
              <div className="space-y-1.5">
                <Label>Time</Label>
                <div className="flex gap-2">
                  {(["morning", "night"] as const).map((t) => (
                    <button key={t} className={`flex-1 h-10 rounded-md border text-sm font-medium transition-colors ${form.time_of_day === t ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-secondary"}`} onClick={() => setForm((f) => ({ ...f, time_of_day: t, products_used: [] }))}>
                      {t === "morning" ? "☀️ AM" : "🌙 PM"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Products used</Label>
              <div className="flex flex-wrap gap-2">
                {defaultProducts.map((p) => (
                  <button key={p} onClick={() => toggleProduct(p)} className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${form.products_used.includes(p) ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:border-foreground"}`}>
                    {p}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Custom product" value={customProduct} onChange={(e) => setCustomProduct(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCustomProduct()} />
                <Button variant="outline" onClick={addCustomProduct}>Add</Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5"><Label>Skin condition</Label><Input placeholder="Dry, oily, clear…" value={form.skin_condition} onChange={(e) => setForm((f) => ({ ...f, skin_condition: e.target.value }))} /></div>
              <div className="space-y-1.5">
                <Label>Irritation (1–5)</Label>
                <Input type="number" min={1} max={5} value={form.irritation_level} onChange={(e) => setForm((f) => ({ ...f, irritation_level: parseInt(e.target.value) || 1 }))} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="breakouts" checked={form.breakouts} onChange={(e) => setForm((f) => ({ ...f, breakouts: e.target.checked }))} className="w-4 h-4 rounded" />
              <Label htmlFor="breakouts" className="cursor-pointer">Had breakouts today</Label>
            </div>

            <div className="space-y-1.5"><Label>Notes</Label><Textarea placeholder="Any observations?" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveLog} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
