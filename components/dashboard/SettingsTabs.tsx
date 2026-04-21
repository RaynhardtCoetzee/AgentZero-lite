"use client";

/**
 * components/dashboard/SettingsTabs.tsx
 *
 * Settings page tab panels: Account · Organisation · API Keys · Billing
 * Props are server-fetched session and org data passed down from the page.
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { KeyRound, CreditCard, Building2, User } from "lucide-react";

type SettingsTabsProps = {
  userName:    string;
  userEmail:   string;
  orgName:     string;
  orgSlug:     string;
  defaultTab?: string;
  billingSlot: React.ReactNode;
};

// ─── Read-only field ──────────────────────────────────────────────────────────

function ReadOnlyField({ id, label, value, placeholder }: {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder ?? "—"}
        disabled
        readOnly
        className="h-8 bg-muted/40 text-sm cursor-not-allowed"
      />
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

export function SettingsTabs({ userName, userEmail, orgName, orgSlug, defaultTab = "account", billingSlot }: SettingsTabsProps) {
  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList className="border border-border bg-card h-8 p-0.5">
        <TabsTrigger value="account"  className="text-xs h-7 px-3 gap-1.5">
          <User className="h-3 w-3" /> Account
        </TabsTrigger>
        <TabsTrigger value="org"      className="text-xs h-7 px-3 gap-1.5">
          <Building2 className="h-3 w-3" /> Organisation
        </TabsTrigger>
        <TabsTrigger value="apikeys"  className="text-xs h-7 px-3 gap-1.5">
          <KeyRound className="h-3 w-3" /> API Keys
        </TabsTrigger>
        <TabsTrigger value="billing"  className="text-xs h-7 px-3 gap-1.5">
          <CreditCard className="h-3 w-3" /> Billing
        </TabsTrigger>
      </TabsList>

      {/* ── Account ── */}
      <TabsContent value="account" className="mt-4 space-y-4">
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <h3 className="text-sm font-medium text-foreground">Account Details</h3>
          <Separator />
          <div className="grid gap-3 sm:grid-cols-2">
            <ReadOnlyField
              id="user-name"
              label="Display Name"
              value={userName}
              placeholder="Not set"
            />
            <ReadOnlyField
              id="user-email"
              label="Email"
              value={userEmail}
            />
          </div>
          <p className="text-[11px] text-muted-foreground/60">
            Name and email editing will be available in a future release.
          </p>
        </div>
      </TabsContent>

      {/* ── Organisation ── */}
      <TabsContent value="org" className="mt-4 space-y-4">
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <h3 className="text-sm font-medium text-foreground">Organisation</h3>
          <Separator />
          <div className="grid gap-3 sm:grid-cols-2">
            <ReadOnlyField
              id="org-name"
              label="Organisation Name"
              value={orgName}
              placeholder="—"
            />
            <ReadOnlyField
              id="org-slug"
              label="Slug"
              value={orgSlug}
              placeholder="—"
            />
          </div>
          <p className="text-[11px] text-muted-foreground/60">
            Organisation settings are managed by the workspace owner.
          </p>
        </div>
      </TabsContent>

      {/* ── API Keys ── */}
      <TabsContent value="apikeys" className="mt-4">
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">API Keys</h3>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal text-muted-foreground">
              Coming soon
            </Badge>
          </div>
          <Separator />
          <div className="rounded-md border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
            <KeyRound className="mx-auto mb-3 h-7 w-7 text-muted-foreground/30" strokeWidth={1.25} />
            <p className="text-sm text-muted-foreground">API key management coming soon.</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Generate and revoke programmatic access keys for your agents.
            </p>
          </div>
        </div>
      </TabsContent>

      {/* ── Billing ── */}
      <TabsContent value="billing" className="mt-4">
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <h3 className="text-sm font-medium text-foreground">Billing</h3>
          <Separator />
          {billingSlot}
        </div>
      </TabsContent>
    </Tabs>
  );
}
