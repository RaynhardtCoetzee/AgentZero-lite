import { redirect } from "next/navigation";

/**
 * /dashboard/billing — redirects to the Billing tab in Settings.
 * Billing UI lives at /dashboard/settings (tab: billing).
 */
export default function BillingPage() {
  redirect("/dashboard/settings");
}
