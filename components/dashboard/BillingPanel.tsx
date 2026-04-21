import { auth } from "@/auth";
import { adminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckoutButton } from "@/components/dashboard/CheckoutButton";
import { PRO_CREDITS_PER_CYCLE, FOUNDING_CREDITS_ONE_TIME } from "@/lib/billing/constants";
import { Zap, Star } from "lucide-react";

type ActiveSub = {
  tier: string;
  status: string;
  renews_at: string | null;
} | null;

async function getActiveSub(userId: string): Promise<ActiveSub> {
  const { data } = await adminClient
    .from("subscriptions")
    .select("tier, status, renews_at")
    .eq("user_id", userId)
    .in("status", ["on_trial", "active", "past_due"])
    .maybeSingle();
  return data ?? null;
}

export async function BillingPanel() {
  const session = await auth();
  const userId = session?.user?.id;
  const sub = userId ? await getActiveSub(userId) : null;
  const hasProSub = sub?.tier === "pro";

  return (
    <div className="space-y-3">
      {/* Pro — recurring */}
      <div
        className={`rounded-lg border p-4 space-y-3 ${
          hasProSub ? "border-primary/40 bg-primary/5" : "border-border bg-card/50"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-foreground">Pro</p>
              <p className="text-xs text-muted-foreground">Monthly subscription</p>
            </div>
          </div>
          {hasProSub ? (
            <Badge className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-primary/30 font-normal">
              Active
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal text-muted-foreground">
              Not subscribed
            </Badge>
          )}
        </div>
        <Separator />
        <p className="text-xs text-muted-foreground">
          {PRO_CREDITS_PER_CYCLE.toLocaleString()} credits per billing cycle, renewed automatically.
        </p>
        {hasProSub ? (
          <p className="text-xs text-muted-foreground/60">
            {sub?.renews_at
              ? `Renews ${new Date(sub.renews_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
              : "Active subscription"}
          </p>
        ) : (
          <CheckoutButton
            tier="pro"
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Subscribe
          </CheckoutButton>
        )}
      </div>

      {/* Founding — one-time */}
      <div className="rounded-lg border border-border bg-card/50 p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-400" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-foreground">Founding</p>
              <p className="text-xs text-muted-foreground">One-time purchase</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 font-normal text-amber-400 border-amber-400/30"
          >
            Limited
          </Badge>
        </div>
        <Separator />
        <p className="text-xs text-muted-foreground">
          {FOUNDING_CREDITS_ONE_TIME.toLocaleString()} credits, never expire. Founding pricing locked in forever.
        </p>
        <CheckoutButton
          tier="founding"
          className="flex items-center gap-1.5 rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-400 hover:bg-amber-400/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Get Founding Access
        </CheckoutButton>
      </div>
    </div>
  );
}
