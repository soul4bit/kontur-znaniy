import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full rounded-2xl border border-slate-500/45 bg-[#0f1d2c]/90 px-4 py-2 text-sm text-slate-100 shadow-[inset_0_1px_0_rgba(149,180,210,0.07)] transition-all",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "placeholder:text-slate-500 focus-visible:border-[#4ed2b3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4ed2b3]/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input };
