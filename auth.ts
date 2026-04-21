/**
 * auth.ts — AgentZero Auth Configuration
 *
 * Strategy : Server Actions only. No /api/auth route handler.
 * Session  : JWT (stateless). orgId + userId are baked into the token
 *            on sign-in and forwarded to every session — zero DB reads
 *            on subsequent requests.
 *
 * headers() boundary:
 *   await headers() from next/headers is NOT available inside Auth.js
 *   callbacks — they run outside the Server Component / Server Action
 *   execution context. Request-context checks (IP, user-agent, etc.)
 *   belong in the Server Action that calls signIn(). That is the next step.
 *
 * DB access pattern:
 *   authorize  → getUserByEmail() [react cache, one hit per request]
 *   jwt        → reads from `user` object (trigger: signIn/signUp) or
 *                existing token (all subsequent requests). No extra query.
 *   session    → projects token fields onto the session object. No query.
 */

import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import argon2 from "argon2";
import { z } from "zod";
import { getUserByEmail } from "@/lib/supabase/queries";

// ─── TypeScript augmentation ──────────────────────────────────────────────────
// Extend the built-in Session and JWT types so TypeScript knows about our
// custom fields without casting everywhere downstream.

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      orgId: string;
    } & DefaultSession["user"];
  }
  interface User {
    orgId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    orgId: string;
  }
}

// ─── Credential schema (Zod 4) ────────────────────────────────────────────────
// Every input validated and described so future tool-selection logic can
// reason about field intent (AGENTS.md § Coding Standards).

const credentialsSchema = z.object({
  email: z
    .string()
    .email()
    .describe("The user's email address — used as the unique login identifier"),
  password: z
    .string()
    .min(8)
    .describe("The user's plaintext password — compared against the bcrypt hash in the DB"),
});

// ─── Auth configuration ───────────────────────────────────────────────────────

export const { auth, signIn, signOut } = NextAuth({
  /**
   * No `handlers` export — we do NOT mount an /api/auth route.
   * signIn() and signOut() are called directly as Server Actions.
   */

  trustHost: true,

  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(rawInput) {
        // Zod 4 validation — throws a descriptive error on malformed input,
        // never silently coerces (CLAUDE.md § No Coercion).
        const parsed = credentialsSchema.safeParse(rawInput);
        if (!parsed.success) {
          throw new Error(`Malformed credentials: ${parsed.error.message}`);
        }

        const { email, password } = parsed.data;

        // One Supabase query, deduplicated via react cache for this request.
        const user = await getUserByEmail(email);
        if (!user) return null;

        const passwordValid = await argon2.verify(user.password_hash, password);
        if (!passwordValid) return null;

        // Return shape feeds directly into the jwt callback below.
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          orgId: user.organisation_id,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    /**
     * jwt — runs on every request that touches the session.
     *
     * trigger === "signIn" | "signUp":
     *   First call after authorize(). `user` is populated. We stamp the token
     *   with id + orgId here — this is the ONLY time we touch DB data, and
     *   only indirectly (the data came from authorize via the user object).
     *
     * trigger === undefined (subsequent requests):
     *   Token already carries id + orgId. Return it as-is. Zero DB reads.
     *
     * trigger === "update":
     *   Explicit session refresh via auth.update() in a Server Action.
     *   Allows an org change to propagate without a full re-login.
     */
    async jwt({ token, user, trigger, session }) {
      if ((trigger === "signIn" || trigger === "signUp") && user) {
        token.id = user.id!;
        token.orgId = user.orgId;
      }

      if (trigger === "update" && session?.orgId) {
        token.orgId = session.orgId as string;
      }

      return token;
    },

    /**
     * session — projects the JWT fields onto the Session object returned
     * to Server Components and Server Actions via auth().
     * No DB calls. No async work. Pure projection.
     */
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.orgId = token.orgId;
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
});
