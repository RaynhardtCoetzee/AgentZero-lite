// Resend email automation tool
import { tool } from "ai";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const inputSchema = z
  .object({
    to: z
      .array(z.string())
      .min(1)
      .describe("One or more recipient email addresses (e.g. 'user@example.com'). Must be valid RFC 5321 addresses."),
    subject: z
      .string()
      .min(1)
      .max(998)
      .describe("Email subject line. Keep under 60 characters for best deliverability."),
    body: z
      .string()
      .min(1)
      .describe("Plain-text email body. Resend will also generate an HTML version from this."),
    replyTo: z
      .string()
      .optional()
      .describe(
        "Optional reply-to address (e.g. 'support@example.com'). Defaults to the from address if omitted."
      ),
  })
  .strict(); // throw on unknown fields — no silent coercion

const outputSchema = z
  .object({
    id: z
      .string()
      .describe("Unique email ID assigned by Resend. Use this to track delivery status."),
    status: z
      .enum(["sent", "failed"])
      .describe('"sent" when Resend accepted the message, "failed" if the API rejected it.'),
    to: z
      .array(z.email())
      .describe("The recipient addresses the email was dispatched to, echoed for traceability."),
  })
  .strict();

// ---------------------------------------------------------------------------
// Types (inferred from schemas — single source of truth)
// ---------------------------------------------------------------------------

type EmailInput = z.infer<typeof inputSchema>;
type EmailOutput = z.infer<typeof outputSchema>;

// ---------------------------------------------------------------------------
// Resend API response shape (internal — not exported)
// ---------------------------------------------------------------------------

interface ResendSuccessResponse {
  id: string;
}

interface ResendErrorResponse {
  name: string;
  message: string;
  statusCode: number;
}

// ---------------------------------------------------------------------------
// Tool definition
// ---------------------------------------------------------------------------

export const emailAutomateTool = tool({
  description:
    "Send a transactional email via Resend. Use this to notify users, deliver reports, or trigger any outbound email from the agent.",
  inputSchema,
  outputSchema,
  execute: async (input: EmailInput): Promise<EmailOutput> => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set.");
    }

    const from = process.env.RESEND_FROM_EMAIL;
    if (!from) {
      throw new Error("RESEND_FROM_EMAIL environment variable is not set.");
    }

    const payload: Record<string, unknown> = {
      from,
      to: input.to,
      subject: input.subject,
      text: input.body,
    };

    if (input.replyTo) {
      payload.reply_to = input.replyTo;
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err: ResendErrorResponse = await response.json();
      throw new Error(
        `Resend API error ${response.status}: ${err.message ?? response.statusText}`
      );
    }

    const data: ResendSuccessResponse = await response.json();

    const raw = {
      id: data.id,
      status: "sent" as const,
      to: input.to,
    };

    // Validate output shape — throws ZodError if Resend returns unexpected data
    return outputSchema.parse(raw);
  },
});
