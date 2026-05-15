/**
 * app/dashboard/agents/new/page.tsx — New Agent
 *
 * Minimal V1 form: name + system prompt → createAgent() → redirect.
 */

import type { Metadata } from "next";
import { NewAgentForm } from "@/components/dashboard/NewAgentForm";

export const metadata: Metadata = {
  title: "New Agent — AgentZero",
};

export default function NewAgentPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 sm:space-y-8">
      <div className="space-y-1.5 sm:space-y-2">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">New Agent</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Give your agent a name and a system prompt. You can edit it later.
        </p>
      </div>

      <NewAgentForm />
    </div>
  );
}
