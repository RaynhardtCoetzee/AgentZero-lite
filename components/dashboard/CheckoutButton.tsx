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
    startTransition(async () => {
      const action = tier === "pro" ? createProCheckout : createFoundingCheckout;
      const result = await action({ redirectPath: "/dashboard/settings?tab=billing" });
      if (result.ok) {
        window.location.href = result.url;
      } else {
        console.error("[billing] checkout error:", result.error);
      }
    });
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
