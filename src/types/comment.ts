export interface Comment {
  id: string
  ens_name_id: number
  user_id: number
  body: string
  created_at: string
  updated_at: string
  author_address: string
  author_persona_id: number | null
}

export interface CommentsResponse {
  comments: Comment[]
  nextCursor: string | null
}

export interface CommentFeedItem {
  id: number
  ens_name_id: number
  name: string
  body: string
  created_at: string
  author_address: string
  owner_address: string
  clubs: string[] | null
}

export interface CommentFeedResponse {
  comments: CommentFeedItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface CommentQuota {
  used: number
  max: number
  remaining: number
  resetsAt: string
}

export interface PostCommentResponse {
  comment: Comment
  quota: {
    used: number
    max: number
    remaining: number
  }
}
