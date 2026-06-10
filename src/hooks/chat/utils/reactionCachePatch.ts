import type { QueryClient, QueryKey, InfiniteData } from '@tanstack/react-query'
import type { ChatMessagesResponse, MessageReaction } from '@/types/chat'

export type ReactionPatchOp =
  /**
   * Optimistic local toggle: flips `reacted` and bumps the count ±1, creating
   * the pill at 1 when adding and removing it at 0.
   */
  | { kind: 'toggle-mine'; add: boolean }
  /**
   * Server-pushed absolute count (WS events are idempotent). Removes the pill
   * when count is 0. `reacted` only changes when the actor is the caller —
   * set to `add` (true for reaction_added, false for reaction_removed).
   */
  | { kind: 'set-count'; count: number; actorIsMe: boolean; add: boolean }

const patchReactions = (reactions: MessageReaction[], emoji: string, op: ReactionPatchOp): MessageReaction[] => {
  const existing = reactions.find((r) => r.emoji === emoji)

  if (op.kind === 'toggle-mine') {
    if (!existing) {
      return op.add ? [...reactions, { emoji, count: 1, reacted: true }] : reactions
    }
    const count = existing.count + (op.add ? 1 : -1)
    if (count <= 0) return reactions.filter((r) => r.emoji !== emoji)
    return reactions.map((r) => (r.emoji === emoji ? { ...r, count, reacted: op.add } : r))
  }

  // set-count
  if (op.count <= 0) return reactions.filter((r) => r.emoji !== emoji)
  if (!existing) {
    return [...reactions, { emoji, count: op.count, reacted: op.actorIsMe && op.add }]
  }
  return reactions.map((r) =>
    r.emoji === emoji ? { ...r, count: op.count, reacted: op.actorIsMe ? op.add : r.reacted } : r
  )
}

/**
 * Immutably patches one emoji's reaction state on a message inside an
 * InfiniteData<ChatMessagesResponse> cache entry (DM or global — pass the key).
 */
export const patchMessageReaction = (
  queryClient: QueryClient,
  queryKey: QueryKey,
  messageId: string,
  emoji: string,
  op: ReactionPatchOp
) => {
  queryClient.setQueryData<InfiniteData<ChatMessagesResponse>>(queryKey, (old) => {
    if (!old) return old
    return {
      ...old,
      pages: old.pages.map((page) => {
        if (!page.messages.some((m) => m.id === messageId)) return page
        return {
          ...page,
          messages: page.messages.map((m) =>
            m.id === messageId ? { ...m, reactions: patchReactions(m.reactions ?? [], emoji, op) } : m
          ),
        }
      }),
    }
  })
}
