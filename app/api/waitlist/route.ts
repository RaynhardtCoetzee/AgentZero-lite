import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'
import { adminClient } from '@/lib/supabase/admin'

const schema = z.object({
  email: z.string().email().describe('Subscriber email address'),
})

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 422 })
  }

  const { email } = parsed.data

  const { error } = await adminClient
    .from('waitlist')
    .insert({ email, created_at: new Date().toISOString() })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'You are already on the waitlist.' },
        { status: 409 },
      )
    }
    return NextResponse.json(
      { error: 'Failed to join waitlist. Please try again.' },
      { status: 500 },
    )
  }

  // Notify founder — fire and forget, don't block the response
  resend.emails.send({
    from: 'onboarding@resend.dev',
    to: 'raynhardt34@gmail.com',
    subject: 'New AgentZero waitlist signup',
    text: `${email} just joined the waitlist.`,
  }).catch(() => undefined)

  return NextResponse.json({ success: true }, { status: 201 })
}
