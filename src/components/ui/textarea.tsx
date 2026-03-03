import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full rounded-2xl border border-[#557a98] bg-[#244862] px-4 py-3 text-sm text-slate-100 shadow-[inset_0_1px_0_rgba(186,230,253,0.12)] transition-all",
        "placeholder:text-[#a9c1d3] focus-visible:border-[#59d3f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#59d3f2]/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
