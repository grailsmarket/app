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
