'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function WaitlistForm({ className }: { className?: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json() as { error?: string }

      if (!res.ok) {
        throw new Error(data.error ?? 'Something went wrong')
      }

      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  if (status === 'success') {
    return (
      <p className={cn('py-3 text-sm font-medium text-green-400', className)}>
        You&apos;re on the list. We&apos;ll be in touch.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-2', className)}>
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={status === 'loading'}
          className="flex-1"
        />
        <Button type="submit" disabled={status === 'loading'} className="w-full sm:w-auto shrink-0">
          {status === 'loading' ? 'Joining…' : 'Join Waitlist'}
        </Button>
      </div>
      {status === 'error' && (
        <p className="text-sm text-red-400">{errorMsg}</p>
      )}
    </form>
  )
}
