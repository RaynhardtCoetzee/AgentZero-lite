"use client";

import { useFormStatus } from "react-dom";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth-actions";
import { cn } from "@/lib/utils";

function ButtonContent({ iconOnly }: { iconOnly: boolean }) {
  const { pending } = useFormStatus();

  if (iconOnly) {
    return (
      <button
        type="submit"
        disabled={pending}
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-sm transition-colors",
          "text-sidebar-foreground/30 hover:text-sidebar-foreground/70",
          "disabled:opacity-50"
        )}
        aria-label={pending ? "Signing out…" : "Sign out"}
      >
        {pending
          ? <Loader2 className="h-3 w-3 animate-spin" />
          : <LogOut className="h-3 w-3" />}
      </button>
    );
  }

  return (
    <Button
      type="submit"
      variant="ghost"
      size="sm"
      disabled={pending}
      className="w-full justify-start gap-2 h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
    >
      {pending
        ? <Loader2 className="h-3 w-3 animate-spin" />
        : <LogOut className="h-3 w-3" />}
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}

export function SignOutButton({ iconOnly = false }: { iconOnly?: boolean }) {
  return (
    <form action={logoutAction}>
      <ButtonContent iconOnly={iconOnly} />
    </form>
  );
}
