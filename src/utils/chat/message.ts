import { MentionState } from '@/types/chat'

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
