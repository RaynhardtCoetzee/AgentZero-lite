import type { Metadata } from "next";
import { auth } from "@/auth";
import { adminClient } from "@/lib/supabase/admin";
import { SettingsTabs } from "@/components/dashboard/SettingsTabs";
import { BillingPanel } from "@/components/dashboard/BillingPanel";

export const metadata: Metadata = {
  title: "Settings — AgentZero",
};

const VALID_TABS = ["account", "org", "apikeys", "billing"] as const;
type Tab = (typeof VALID_TABS)[number];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [session, params] = await Promise.all([auth(), searchParams]);

  const tabParam = typeof params.tab === "string" ? params.tab : "account";
  const defaultTab: Tab = (VALID_TABS as readonly string[]).includes(tabParam)
    ? (tabParam as Tab)
    : "account";

  const orgId = session?.user?.orgId;
  let orgName = "";
  let orgSlug = "";

  if (orgId) {
    const { data } = await adminClient
      .from("organisations")
      .select("name, slug")
      .eq("id", orgId)
      .single();
    if (data) {
      orgName = (data.name as string) ?? "";
      orgSlug = (data.slug as string) ?? "";
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Account and workspace configuration.
        </p>
      </div>

      <SettingsTabs
        userName={session?.user?.name ?? ""}
        userEmail={session?.user?.email ?? ""}
        orgName={orgName}
        orgSlug={orgSlug}
        defaultTab={defaultTab}
        billingSlot={<BillingPanel />}
      />
    </div>
  );
}
