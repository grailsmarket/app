import type { CommentFeedItem } from '@/types/comment'

export interface ReplyContext {
  comment: CommentFeedItem
  name: string
}
