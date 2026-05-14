"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Income, Expense, Debt, Bill, Subscription, SavingsGoal } from "@/lib/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Wallet, Plus, Trash2, MoreVertical, Loader2, TrendingUp, TrendingDown, PiggyBank, CreditCard, Receipt, RefreshCw } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { toast } from "@/lib/hooks/use-toast";
import { format, startOfMonth } from "date-fns";

interface FinanceClientProps {
  initialIncome: Income[];
  initialExpenses: Expense[];
  initialDebts: Debt[];
  initialBills: Bill[];
  initialSubscriptions: Subscription[];
  initialSavingsGoals: SavingsGoal[];
  userId: string;
}

const EXPENSE_CATS = ["food", "transport", "entertainment", "health", "clothing", "utilities", "tech", "fitness", "general"];

export function FinanceClient({ initialIncome, initialExpenses, initialDebts, initialBills, initialSubscriptions, initialSavingsGoals, userId }: FinanceClientProps) {
  const supabase = createClient();
  const [income, setIncome] = useState<Income[]>(initialIncome);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [debts, setDebts] = useState<Debt[]>(initialDebts);
  const [bills, setBills] = useState<Bill[]>(initialBills);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(initialSubscriptions);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(initialSavingsGoals);
  const [dialogType, setDialogType] = useState<"income" | "expense" | "debt" | "bill" | "sub" | "goal" | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  const thisMonthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthlyExpenses = expenses.filter((e) => e.expense_date >= thisMonthStart);
  const totalMonthlyExpense = monthlyExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalMonthlyIncome = income.filter((i) => i.frequency === "monthly" || i.frequency === "fortnightly").reduce((s, i) => {
    if (i.frequency === "fortnightly") return s + Number(i.amount) * 2;
    return s + Number(i.amount);
  }, 0);
  const totalBills = bills.filter((b) => !b.is_paid).reduce((s, b) => s + Number(b.amount), 0);
  const totalSubs = subscriptions.reduce((s, sub) => {
    if (sub.billing_cycle === "monthly") return s + Number(sub.amount);
    if (sub.billing_cycle === "yearly") return s + Number(sub.amount) / 12;
    return s;
  }, 0);
  const totalDebt = debts.reduce((s, d) => s + Number(d.remaining_amount), 0);
  const remaining = totalMonthlyIncome - totalMonthlyExpense - totalBills - totalSubs;

  async function addItem() {
    setSaving(true);
    try {
      switch (dialogType) {
        case "income": {
          const { data } = await supabase.from("income").insert({ user_id: userId, ...form }).select().single();
          if (data) setIncome((prev) => [data, ...prev]);
          break;
        }
        case "expense": {
          const { data } = await supabase.from("expenses").insert({ user_id: userId, expense_date: form.expense_date || format(new Date(), "yyyy-MM-dd"), ...form }).select().single();
          if (data) setExpenses((prev) => [data, ...prev]);
          break;
        }
        case "debt": {
          const { data } = await supabase.from("debts").insert({ user_id: userId, remaining_amount: form.total_amount, ...form }).select().single();
          if (data) setDebts((prev) => [...prev, data]);
          break;
        }
        case "bill": {
          const { data } = await supabase.from("bills").insert({ user_id: userId, is_paid: false, auto_pay: false, ...form }).select().single();
          if (data) setBills((prev) => [...prev, data]);
          break;
        }
        case "sub": {
          const { data } = await supabase.from("subscriptions").insert({ user_id: userId, is_active: true, ...form }).select().single();
          if (data) setSubscriptions((prev) => [...prev, data]);
          break;
        }
        case "goal": {
          const { data } = await supabase.from("savings_goals").insert({ user_id: userId, current_amount: 0, ...form }).select().single();
          if (data) setSavingsGoals((prev) => [...prev, data]);
          break;
        }
      }
      toast({ title: "Saved!" });
    } catch (e) { toast({ title: "Error", variant: "destructive" }); }
    setSaving(false);
    setDialogType(null);
    setForm({});
  }

  async function deleteBill(id: string) {
    await supabase.from("bills").delete().eq("id", id);
    setBills((prev) => prev.filter((b) => b.id !== id));
  }

  async function toggleBillPaid(bill: Bill) {
    const { data } = await supabase.from("bills").update({ is_paid: !bill.is_paid }).eq("id", bill.id).select().single();
    if (data) setBills((prev) => prev.map((b) => b.id === data.id ? data : b));
  }

  function openDialog(type: typeof dialogType) {
    setForm({});
    setDialogType(type);
  }

  // Expense breakdown by category
  const expenseByCategory = useMemo(() => {
    const cats: Record<string, number> = {};
    monthlyExpenses.forEach((e) => { cats[e.category] = (cats[e.category] ?? 0) + Number(e.amount); });
    return Object.entries(cats).sort((a, b) => b[1] - a[1]);
  }, [monthlyExpenses]);

  return (
    <>
      <PageHeader icon={Wallet} title="Finance" description="Budget, expenses, debt, and savings" />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card><CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-green-400" /><span className="text-xs text-muted-foreground">Monthly income</span></div>
          <p className="text-xl font-bold text-green-400">{formatCurrency(totalMonthlyIncome)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-1"><TrendingDown className="w-4 h-4 text-red-400" /><span className="text-xs text-muted-foreground">Expenses (MTD)</span></div>
          <p className="text-xl font-bold text-red-400">{formatCurrency(totalMonthlyExpense)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-1"><PiggyBank className="w-4 h-4 text-blue-400" /><span className="text-xs text-muted-foreground">Remaining</span></div>
          <p className={`text-xl font-bold ${remaining >= 0 ? "text-green-400" : "text-red-400"}`}>{formatCurrency(remaining)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-1"><CreditCard className="w-4 h-4 text-yellow-400" /><span className="text-xs text-muted-foreground">Total debt</span></div>
          <p className="text-xl font-bold text-yellow-400">{formatCurrency(totalDebt)}</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4 w-full overflow-x-auto flex h-auto justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="bills">Bills</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="debts">Debt</TabsTrigger>
          <TabsTrigger value="savings">Savings</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Monthly breakdown</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: "Income", amount: totalMonthlyIncome, color: "bg-green-500" },
                  { label: "Expenses", amount: totalMonthlyExpense, color: "bg-red-500" },
                  { label: "Bills", amount: totalBills, color: "bg-orange-500" },
                  { label: "Subscriptions", amount: totalSubs, color: "bg-purple-500" },
                ].map(({ label, amount, color }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${color} shrink-0`} />
                    <span className="text-sm flex-1">{label}</span>
                    <span className="text-sm font-medium">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Spending by category</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {!expenseByCategory.length ? <p className="text-xs text-muted-foreground">No expenses this month.</p> :
                  expenseByCategory.map(([cat, amount]) => (
                    <div key={cat} className="flex items-center gap-2">
                      <span className="text-sm flex-1 capitalize">{cat}</span>
                      <span className="text-xs text-muted-foreground">{formatCurrency(amount)}</span>
                    </div>
                  ))
                }
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Expenses */}
        <TabsContent value="expenses">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-muted-foreground">{expenses.length} total expenses</p>
            <Button size="sm" onClick={() => openDialog("expense")} className="gap-1.5"><Plus className="w-4 h-4" />Add</Button>
          </div>
          {!expenses.length ? <EmptyState icon={Receipt} title="No expenses" description="Track your spending." actionLabel="Add Expense" onAction={() => openDialog("expense")} /> : (
            <div className="space-y-2">
              {expenses.slice(0, 30).map((e) => (
                <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-secondary/20 group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{e.category} · {formatDate(e.expense_date)}</p>
                  </div>
                  <p className="text-sm font-semibold text-red-400">{formatCurrency(Number(e.amount))}</p>
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => { supabase.from("expenses").delete().eq("id", e.id); setExpenses((p) => p.filter((x) => x.id !== e.id)); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Bills */}
        <TabsContent value="bills">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-muted-foreground">Total due: {formatCurrency(totalBills)}</p>
            <Button size="sm" onClick={() => openDialog("bill")} className="gap-1.5"><Plus className="w-4 h-4" />Add Bill</Button>
          </div>
          {!bills.length ? <EmptyState icon={Receipt} title="No bills" description="Track your recurring bills." actionLabel="Add Bill" onAction={() => openDialog("bill")} /> : (
            <div className="space-y-2">
              {bills.map((bill) => (
                <div key={bill.id} className={`flex items-center gap-3 p-3 rounded-lg border bg-card group ${bill.is_paid ? "opacity-60 border-border/50" : "border-border"}`}>
                  <button className={`w-5 h-5 rounded border flex items-center justify-center text-xs shrink-0 ${bill.is_paid ? "bg-green-500/20 border-green-500/30 text-green-400" : "border-border"}`} onClick={() => toggleBillPaid(bill)}>
                    {bill.is_paid ? "✓" : ""}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${bill.is_paid ? "line-through text-muted-foreground" : ""}`}>{bill.name}</p>
                    <p className="text-xs text-muted-foreground">{bill.category} · Due {formatDate(bill.due_date)} · {bill.frequency}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(Number(bill.amount))}</p>
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => deleteBill(bill.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Subscriptions */}
        <TabsContent value="subscriptions">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-muted-foreground">Monthly cost: {formatCurrency(totalSubs)}</p>
            <Button size="sm" onClick={() => openDialog("sub")} className="gap-1.5"><Plus className="w-4 h-4" />Add Subscription</Button>
          </div>
          {!subscriptions.length ? <EmptyState icon={RefreshCw} title="No subscriptions" description="Track your recurring subscriptions." actionLabel="Add Subscription" onAction={() => openDialog("sub")} /> : (
            <div className="grid gap-3 md:grid-cols-2">
              {subscriptions.map((sub) => (
                <Card key={sub.id} className="group">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium">{sub.name}</p>
                        <p className="text-xs text-muted-foreground">{sub.billing_cycle}</p>
                        {sub.next_billing_date && <p className="text-xs text-muted-foreground">Next: {formatDate(sub.next_billing_date)}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{formatCurrency(Number(sub.amount))}</p>
                        <p className="text-xs text-muted-foreground">/{sub.billing_cycle === "monthly" ? "mo" : "yr"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Debt */}
        <TabsContent value="debts">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-muted-foreground">Total: {formatCurrency(totalDebt)}</p>
            <Button size="sm" onClick={() => openDialog("debt")} className="gap-1.5"><Plus className="w-4 h-4" />Add Debt</Button>
          </div>
          {!debts.length ? <EmptyState icon={CreditCard} title="No debts tracked" description="Track what you owe." actionLabel="Add Debt" onAction={() => openDialog("debt")} /> : (
            <div className="space-y-3">
              {debts.map((debt) => {
                const pct = Math.round(((Number(debt.total_amount) - Number(debt.remaining_amount)) / Number(debt.total_amount)) * 100);
                return (
                  <Card key={debt.id}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium">{debt.name}</p>
                          {debt.interest_rate && <p className="text-xs text-muted-foreground">{debt.interest_rate}% p.a.</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-red-400">{formatCurrency(Number(debt.remaining_amount))}</p>
                          <p className="text-xs text-muted-foreground">of {formatCurrency(Number(debt.total_amount))}</p>
                        </div>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                      <p className="text-xs text-muted-foreground mt-1">{pct}% paid off</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Savings */}
        <TabsContent value="savings">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-muted-foreground">{savingsGoals.length} goals</p>
            <Button size="sm" onClick={() => openDialog("goal")} className="gap-1.5"><Plus className="w-4 h-4" />Add Goal</Button>
          </div>
          {!savingsGoals.length ? <EmptyState icon={PiggyBank} title="No savings goals" description="Create a savings goal." actionLabel="Add Goal" onAction={() => openDialog("goal")} /> : (
            <div className="grid gap-4 md:grid-cols-2">
              {savingsGoals.map((goal) => {
                const pct = Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100);
                return (
                  <Card key={goal.id}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium">{goal.name}</p>
                          {goal.deadline && <p className="text-xs text-muted-foreground">By {formatDate(goal.deadline)}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{formatCurrency(Number(goal.current_amount))}</p>
                          <p className="text-xs text-muted-foreground">/ {formatCurrency(Number(goal.target_amount))}</p>
                        </div>
                      </div>
                      <Progress value={pct} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">{pct}% complete</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Generic add dialog */}
      <Dialog open={!!dialogType} onOpenChange={(o) => { if (!o) setDialogType(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {dialogType === "income" && "Add Income"}
              {dialogType === "expense" && "Add Expense"}
              {dialogType === "debt" && "Add Debt"}
              {dialogType === "bill" && "Add Bill"}
              {dialogType === "sub" && "Add Subscription"}
              {dialogType === "goal" && "Add Savings Goal"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {(dialogType === "income" || dialogType === "expense" || dialogType === "debt" || dialogType === "bill" || dialogType === "sub" || dialogType === "goal") && (
              <>
                <div className="space-y-1.5">
                  <Label>{dialogType === "income" ? "Source" : "Name"} *</Label>
                  <Input placeholder={dialogType === "income" ? "Salary, Freelance…" : "Name"} value={form.source || form.name || form.title || ""} onChange={(e) => setForm((f) => ({ ...f, [dialogType === "income" ? "source" : dialogType === "expense" ? "title" : "name"]: e.target.value }))} autoFocus />
                </div>
                <div className="space-y-1.5">
                  <Label>Amount ($) *</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={form.amount || ""} onChange={(e) => setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} />
                </div>
                {dialogType === "income" && (
                  <div className="space-y-1.5">
                    <Label>Frequency</Label>
                    <Select value={form.frequency || "monthly"} onValueChange={(v) => setForm((f) => ({ ...f, frequency: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["once", "weekly", "fortnightly", "monthly", "yearly"].map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {dialogType === "expense" && (
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Select value={form.category || "general"} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{EXPENSE_CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
                {(dialogType === "bill") && (
                  <div className="space-y-1.5">
                    <Label>Due date</Label>
                    <Input type="date" value={form.due_date || ""} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} />
                  </div>
                )}
                {(dialogType === "goal") && (
                  <div className="space-y-1.5">
                    <Label>Target ($)</Label>
                    <Input type="number" placeholder="5000" value={form.target_amount || ""} onChange={(e) => setForm((f) => ({ ...f, target_amount: parseFloat(e.target.value) || 0 }))} />
                  </div>
                )}
                {(dialogType === "sub") && (
                  <div className="space-y-1.5">
                    <Label>Billing cycle</Label>
                    <Select value={form.billing_cycle || "monthly"} onValueChange={(v) => setForm((f) => ({ ...f, billing_cycle: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["weekly", "monthly", "yearly"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogType(null)}>Cancel</Button>
            <Button onClick={addItem} disabled={saving || (!form.source && !form.name && !form.title)}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
