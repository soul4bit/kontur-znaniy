import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full rounded-xl border border-input bg-card px-4 py-2 text-sm text-foreground shadow-[0_3px_10px_rgba(34,29,23,0.08)] transition-all",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
        "[&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_var(--card)] [&:-webkit-autofill]:[-webkit-text-fill-color:var(--foreground)] [&:-webkit-autofill:hover]:shadow-[inset_0_0_0px_1000px_var(--card)] [&:-webkit-autofill:focus]:shadow-[inset_0_0_0px_1000px_var(--card)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input };
