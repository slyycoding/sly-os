"use client";

import { useRouter } from "next/navigation";
import { Zap, X } from "lucide-react";

export function DemoBanner() {
  const router = useRouter();

  function exitDemo() {
    document.cookie = "sly-demo=; path=/; max-age=0";
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between gap-2 px-4 py-1.5 bg-red-500/10 border-b border-red-500/20 text-xs text-red-400 shrink-0">
      <div className="flex items-center gap-1.5">
        <Zap className="w-3 h-3" />
        <span>Demo mode — data won&apos;t be saved. Connect Supabase to unlock full functionality.</span>
      </div>
      <button onClick={exitDemo} className="hover:text-red-300 transition-colors shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
