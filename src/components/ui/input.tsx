import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full rounded-2xl border border-[#315776] bg-[#112942] px-4 py-2 text-sm text-slate-100 shadow-[inset_0_1px_0_rgba(186,230,253,0.12)] transition-all",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "placeholder:text-[#7da3be] focus-visible:border-[#59d3f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#59d3f2]/30",
        "[&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#112942] [&:-webkit-autofill]:[-webkit-text-fill-color:#e6f0f8] [&:-webkit-autofill:hover]:shadow-[inset_0_0_0px_1000px_#112942] [&:-webkit-autofill:focus]:shadow-[inset_0_0_0px_1000px_#112942]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input };
