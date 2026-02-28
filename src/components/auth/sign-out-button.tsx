"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
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
      className="rounded-2xl border-slate-200 bg-white/80 text-slate-900 hover:bg-[#edf3ef]"
      onClick={handleSignOut}
      disabled={isPending}
    >
      {isPending ? "Выходим..." : "Выйти"}
    </Button>
  );
}
