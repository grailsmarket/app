import { ChatMessage, MentionState } from '@/types/chat'
import { isSameDay, differenceInMinutes } from 'date-fns'

// Counts unicode code points so multi-code-unit characters (emoji) count as 1.
export const codePointLength = (s: string) => Array.from(s).length

// Walk back from the caret to find an active `@<query>` mention.
// Returns null if the caret isn't inside a mention.
export const detectMention = (value: string, caret: number): MentionState | null => {
  for (let i = caret - 1; i >= 0; i--) {
    const ch = value[i]
    if (ch === '@') {
      const prev = i === 0 ? '' : value[i - 1]
      if (i !== 0 && !/\s/.test(prev)) return null
      return { start: i, query: value.slice(i + 1, caret) }
    }
    if (/\s/.test(ch)) return null
  }
  return null
}

const SENDER_RUN_GAP_MINUTES = 5

export const startsNewRun = (message: ChatMessage, previous: ChatMessage | null): boolean => {
  if (!previous) return true
  if (previous.sender_address?.toLowerCase() !== message.sender_address?.toLowerCase()) return true
  const current = new Date(message.created_at)
  const prev = new Date(previous.created_at)
  if (!isSameDay(current, prev)) return true
  return differenceInMinutes(current, prev) > SENDER_RUN_GAP_MINUTES
}
