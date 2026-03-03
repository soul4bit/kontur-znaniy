"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SignOutButtonProps = {
  className?: string;
};

export function SignOutButton({ className }: SignOutButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleSignOut() {
    setIsPending(true);

    try {
      await authClient.signOut();
      router.replace("/auth");
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "rounded-2xl border-[#5a7f9b] bg-[#234761] text-[#e6f0f8] hover:bg-[#2d5876]",
        className
      )}
      onClick={handleSignOut}
      disabled={isPending}
    >
      {isPending ? "Выходим..." : "Выйти"}
    </Button>
  );
}
