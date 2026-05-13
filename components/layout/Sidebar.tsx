"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard, CheckSquare, Calendar, FolderKanban, FileText, BookOpen,
  Dumbbell, Sparkles, Package, Wallet, Target, GraduationCap, Heart,
  Bell, Search, Settings, Terminal, ClipboardList, Activity,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { separator: true, label: "Productivity" },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Notes", href: "/notes", icon: FileText },
  { separator: true, label: "Health & Fitness" },
  { label: "Gym Log", href: "/gym", icon: Dumbbell },
  { label: "Skincare", href: "/skincare", icon: Sparkles },
  { label: "Health", href: "/health", icon: Heart },
  { separator: true, label: "Finance" },
  { label: "Finance", href: "/finance", icon: Wallet },
  { label: "Products", href: "/products", icon: Package },
  { separator: true, label: "Growth" },
  { label: "Habits", href: "/habits", icon: Activity },
  { label: "Goals", href: "/goals", icon: Target },
  { label: "Learning", href: "/learning", icon: GraduationCap },
  { separator: true, label: "System" },
  { label: "Reminders", href: "/reminders", icon: Bell },
  { label: "Search", href: "/search", icon: Search },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-screen w-[var(--sidebar-width)] flex-col border-r border-border bg-card",
        className
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 px-4 border-b border-border shrink-0">
        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center glow-red shrink-0">
          <Terminal className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold tracking-tight text-white leading-none">Sly OS</div>
          <div className="text-[10px] text-muted-foreground leading-none mt-0.5">Personal Life OS</div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-2">
        <nav className="space-y-0.5">
          {navItems.map((item, i) => {
            if ("separator" in item) {
              return (
                <div key={i} className="pt-4 pb-1 first:pt-2">
                  <p className="px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    {item.label}
                  </p>
                </div>
              );
            }

            const Icon = item.icon;
            const isActive = item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-red-500/15 text-red-400 border border-red-500/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", isActive && "text-red-400")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Bottom: version */}
      <div className="border-t border-border px-4 py-3">
        <p className="text-[10px] text-muted-foreground/40">Sly OS v0.1.0</p>
      </div>
    </aside>
  );
}
