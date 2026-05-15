"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";
import { registerAction, type ActionResult } from "@/lib/actions/auth-actions";
import { cn } from "@/lib/utils";

const initialState: ActionResult | null = null;

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);

  return (
    <div className="relative w-full max-w-md">
      <div className="pointer-events-none absolute -inset-x-8 -top-12 h-40 bg-primary/6 blur-3xl rounded-full" aria-hidden />

      <div className="relative mb-8 anim-fade-up">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary text-[10px] font-black font-mono text-black leading-none shadow-[0_0_24px_rgba(200,241,53,0.45)]">
            AZ
          </div>
          <p className="font-mono text-[10px] font-black tracking-widest uppercase text-primary">
            AgentZero
          </p>
        </div>
        <h1 className="font-mono font-black text-2xl leading-tight mb-2 text-foreground">
          Create your workspace
        </h1>
        <p className="text-sm text-muted-foreground">
          Build AI agents that work.
        </p>
      </div>

      <form
        action={formAction}
        className="relative space-y-4 p-6 rounded-md glass-2 anim-fade-up anim-fade-up-delay-1"
      >
        {state?.success === false && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-sm px-3 py-2 text-sm bg-destructive/8 border border-destructive/25 text-destructive"
          >
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <p>{state.error}</p>
          </div>
        )}

        <FormField id="name" name="name" type="text" label="Full name" autoComplete="name" required placeholder="Jane Doe" disabled={isPending} />
        <FormField id="orgName" name="orgName" type="text" label="Organisation name" required placeholder="Acme Corp" disabled={isPending} />
        <FormField id="email" name="email" type="email" label="Email" autoComplete="email" required placeholder="you@company.com" disabled={isPending} />
        <FormField id="password" name="password" type="password" label="Password" autoComplete="new-password" required placeholder="••••••••" disabled={isPending} />

        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "tap-target relative w-full rounded-sm px-4 py-2.5 mt-2",
            "font-mono text-[11px] font-black uppercase tracking-widest",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            "transition-[background-color,box-shadow,transform] duration-150 press",
            "shadow-[0_0_24px_-8px_rgba(200,241,53,0.55)] hover:shadow-[0_0_32px_-6px_rgba(200,241,53,0.7)]",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Creating workspace…
            </span>
          ) : (
            "Create workspace"
          )}
        </button>

        <p className="text-center text-sm text-muted-foreground pt-1">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary hover:text-primary/90 transition-colors duration-150 font-medium"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  name: string;
  label: string;
}

function FormField({ id, label, className, ...props }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block font-mono text-[10px] tracking-widest uppercase text-muted-foreground/70"
      >
        {label}
      </label>
      <input
        id={id}
        className={cn(
          "tap-target w-full rounded-sm px-3 py-2.5 text-sm",
          "bg-white/[0.025] border border-white/[0.08] text-foreground",
          "placeholder:text-muted-foreground/40",
          "transition-[border-color,box-shadow,background-color] duration-150 outline-none",
          "focus:border-primary/50 focus:bg-white/[0.04] focus:shadow-[0_0_0_3px_rgba(200,241,53,0.12)]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className,
        )}
        {...props}
      />
    </div>
  );
}