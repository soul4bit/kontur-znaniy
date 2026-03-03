import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4 outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "border border-[#38c7eb] bg-[#1aa9cf] text-[#052235] shadow-[0_10px_22px_rgba(26,169,207,0.34)] hover:bg-[#1698bb]",
        destructive:
          "border border-rose-400 bg-destructive text-white shadow-[0_8px_18px_rgba(220,77,104,0.28)] hover:bg-[#c83a55] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-[#345a78] bg-[#0f253c] text-[#c9dff0] shadow-[inset_0_1px_0_rgba(186,230,253,0.12)] hover:bg-[#13304b]",
        secondary:
          "border border-[#2f5674] bg-[#112a42] text-[#d6e8f6] shadow-[inset_0_1px_0_rgba(186,230,253,0.1)] hover:bg-[#16344f]",
        ghost: "text-[#b8d2e8] hover:bg-[#143049] hover:text-[#e2f2ff]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-11 px-6 has-[>svg]:px-4",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
