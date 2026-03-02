import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full rounded-2xl border border-slate-500/45 bg-[#0f1d2c]/90 px-4 py-3 text-sm text-slate-100 shadow-[inset_0_1px_0_rgba(149,180,210,0.07)] transition-all",
        "placeholder:text-slate-500 focus-visible:border-[#4ed2b3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4ed2b3]/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
