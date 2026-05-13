"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QuickAddModal } from "@/components/shared/QuickAddModal";
import { Plus } from "lucide-react";

export function DashboardQuickAdd({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" className="gap-1.5 shrink-0">
        <Plus className="w-4 h-4" /> Quick Add
      </Button>
      <QuickAddModal open={open} onClose={() => setOpen(false)} userId={userId} />
    </>
  );
}
