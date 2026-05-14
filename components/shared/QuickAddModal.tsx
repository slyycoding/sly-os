"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckSquare, FileText, DollarSign, ClipboardList } from "lucide-react";
import { toast } from "@/lib/hooks/use-toast";

interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

export function QuickAddModal({ open, onClose, userId }: QuickAddModalProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  // Task state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskDueDate, setTaskDueDate] = useState(todayStr);

  // Note state
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  // Expense state
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("general");

  // Log state
  const [logNote, setLogNote] = useState("");
  const [logMood, setLogMood] = useState("7");

  function reset() {
    setTaskTitle(""); setTaskPriority("medium"); setTaskDueDate(todayStr);
    setNoteTitle(""); setNoteContent("");
    setExpenseTitle(""); setExpenseAmount(""); setExpenseCategory("general");
    setLogNote(""); setLogMood("7");
  }

  async function addTask() {
    if (!taskTitle.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("tasks").insert({
      user_id: userId,
      title: taskTitle.trim(),
      priority: taskPriority as "low" | "medium" | "high",
      due_date: taskDueDate || null,
      status: "not_started",
    });
    setLoading(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Task added" });
    reset(); onClose(); router.refresh();
  }

  async function addNote() {
    if (!noteTitle.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("notes").insert({
      user_id: userId, title: noteTitle.trim(), content: noteContent,
    });
    setLoading(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Note saved" });
    reset(); onClose(); router.refresh();
  }

  async function addExpense() {
    if (!expenseTitle.trim() || !expenseAmount) return;
    setLoading(true);
    const { error } = await supabase.from("expenses").insert({
      user_id: userId, title: expenseTitle.trim(),
      amount: parseFloat(expenseAmount), category: expenseCategory,
      expense_date: new Date().toISOString().split("T")[0],
    });
    setLoading(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Expense logged" });
    reset(); onClose(); router.refresh();
  }

  async function addHealthLog() {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const { error } = await supabase.from("health_logs").upsert({
      user_id: userId, log_date: today,
      mood: parseInt(logMood), notes: logNote || null,
    }, { onConflict: "user_id,log_date" });
    setLoading(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Health log saved" });
    reset(); onClose(); router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Add</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="task">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="task" className="gap-1 text-xs"><CheckSquare className="w-3 h-3" />Task</TabsTrigger>
            <TabsTrigger value="note" className="gap-1 text-xs"><FileText className="w-3 h-3" />Note</TabsTrigger>
            <TabsTrigger value="expense" className="gap-1 text-xs"><DollarSign className="w-3 h-3" />Expense</TabsTrigger>
            <TabsTrigger value="log" className="gap-1 text-xs"><ClipboardList className="w-3 h-3" />Log</TabsTrigger>
          </TabsList>

          {/* Task */}
          <TabsContent value="task" className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input placeholder="What needs to be done?" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={taskPriority} onValueChange={setTaskPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Due date</Label>
                <Input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
              </div>
            </div>
            <Button onClick={addTask} disabled={loading || !taskTitle.trim()} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Task"}
            </Button>
          </TabsContent>

          {/* Note */}
          <TabsContent value="note" className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input placeholder="Note title" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Content</Label>
              <Textarea placeholder="Write your note…" value={noteContent} onChange={(e) => setNoteContent(e.target.value)} rows={3} />
            </div>
            <Button onClick={addNote} disabled={loading || !noteTitle.trim()} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Note"}
            </Button>
          </TabsContent>

          {/* Expense */}
          <TabsContent value="expense" className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input placeholder="What did you spend on?" value={expenseTitle} onChange={(e) => setExpenseTitle(e.target.value)} autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Amount ($)</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["food", "transport", "entertainment", "health", "clothing", "utilities", "general"].map(c => (
                      <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={addExpense} disabled={loading || !expenseTitle.trim() || !expenseAmount} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log Expense"}
            </Button>
          </TabsContent>

          {/* Log */}
          <TabsContent value="log" className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label>Mood today (1–10)</Label>
              <Input type="number" min={1} max={10} value={logMood} onChange={(e) => setLogMood(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea placeholder="How are you feeling?" value={logNote} onChange={(e) => setLogNote(e.target.value)} rows={3} />
            </div>
            <Button onClick={addHealthLog} disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Log"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
