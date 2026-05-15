import { Badge } from '@/components/ui/badge'

const STACK = [
  'Next.js 16',
  'AI SDK 6',
  'Supabase',
  'Auth.js v5',
  'pgvector',
  'Lemon Squeezy',
  'TypeScript',
  'Zod 4',
]

export function StackStrip() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {STACK.map((tech) => (
        <Badge key={tech} variant="outline" className="px-3 py-1 text-sm font-mono">
          {tech}
        </Badge>
      ))}
    </div>
  )
}
