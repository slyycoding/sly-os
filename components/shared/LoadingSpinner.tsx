import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function LoadingSpinner({ className, size = "md", label }: LoadingSpinnerProps) {
  const sizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 py-8", className)}>
      <Loader2 className={cn("animate-spin text-muted-foreground", sizes[size])} />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center h-48">
      <LoadingSpinner size="lg" label="Loading…" />
    </div>
  );
}
