import { createClient } from "@/lib/supabase/server";
import { getUserOrDemo } from "@/lib/auth/getUser";
import { FinanceClient } from "@/components/finance/FinanceClient";

export default async function FinancePage() {
  const { user, isDemo } = await getUserOrDemo();

  if (isDemo) {
    return (
      <div className="p-4 md:p-6 animate-fade-in">
        <FinanceClient initialIncome={[]} initialExpenses={[]} initialDebts={[]} initialBills={[]} initialSubscriptions={[]} initialSavingsGoals={[]} userId={user.id} />
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: income }, { data: expenses }, { data: debts }, { data: bills }, { data: subscriptions }, { data: savingsGoals }] = await Promise.all([
    supabase.from("income").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("expenses").select("*").eq("user_id", user.id).order("expense_date", { ascending: false }).limit(100),
    supabase.from("debts").select("*").eq("user_id", user.id),
    supabase.from("bills").select("*").eq("user_id", user.id).order("due_date"),
    supabase.from("subscriptions").select("*").eq("user_id", user.id).eq("is_active", true),
    supabase.from("savings_goals").select("*").eq("user_id", user.id),
  ]);

  return (
    <div className="p-4 md:p-6 animate-fade-in">
      <FinanceClient initialIncome={income ?? []} initialExpenses={expenses ?? []} initialDebts={debts ?? []} initialBills={bills ?? []} initialSubscriptions={subscriptions ?? []} initialSavingsGoals={savingsGoals ?? []} userId={user.id} />
    </div>
  );
}
