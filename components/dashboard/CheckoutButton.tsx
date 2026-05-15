// AgentZero Lite — billing layer removed
"use client";

import { useTransition } from "react";
import { CreditCard, Loader2 } from "lucide-react";

export function CheckoutButton({
  tier,
  className,
  children,
}: {
  tier: "pro" | "founding";
  className?: string;
  children: React.ReactNode;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    console.warn("[lite] billing checkout is disabled in AgentZero Lite.");
  }

  return (
    <button onClick={handleClick} disabled={isPending} className={className}>
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <CreditCard className="h-3.5 w-3.5" />
      )}
      {children}
    </button>
  );
}
