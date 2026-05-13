import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { isDemoMode, DEMO_PROFILE } from "@/lib/auth/getUser";
import { DemoBanner } from "@/components/layout/DemoBanner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const demo = await isDemoMode();

  let profile = null;

  if (demo) {
    profile = DEMO_PROFILE as any;
  } else {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) redirect("/login");
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      profile = data;
    } catch {
      redirect("/login");
    }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar className="hidden md:flex" />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header profile={profile} />
        {demo && <DemoBanner />}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
