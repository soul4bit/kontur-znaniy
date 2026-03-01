import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full rounded-2xl border border-emerald-200/90 bg-white/92 px-4 py-3 text-sm shadow-xs transition-colors",
        "placeholder:text-emerald-900/35 focus-visible:border-emerald-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
