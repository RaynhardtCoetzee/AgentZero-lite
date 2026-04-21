/**
 * app/dashboard/agents/new/page.tsx — New Agent
 *
 * Template picker → model selector → tool toggles → createAgent() → redirect.
 * The UI collects intent (name, template, model, tools). createAgent() is called
 * on submit; the created ID is used to redirect to the detail page.
 */

import type { Metadata } from "next";
import { NewAgentForm } from "@/components/dashboard/NewAgentForm";

export const metadata: Metadata = {
  title: "New Agent — AgentZero",
};

export default function NewAgentPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">New Agent</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Pick a template to get started quickly, or build from scratch.
        </p>
      </div>

      <NewAgentForm />
    </div>
  );
}
