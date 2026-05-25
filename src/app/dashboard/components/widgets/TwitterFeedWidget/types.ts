export type TwitterEntity = {
  start: number
  end: number
}

export type TwitterUrlEntity = TwitterEntity & {
  url: string
  expanded_url?: string
  display_url?: string
  media_key?: string
}

export type TwitterMentionEntity = TwitterEntity & {
  username: string
}

export type TwitterTagEntity = TwitterEntity & {
  tag: string
}

export type TwitterPostMedia = {
  key: string
  type: 'photo' | 'video' | 'animated_gif'
  url: string | null
  previewImageUrl?: string
  width?: number
  height?: number
}

export type TwitterPost = {
  id: string
  text: string
  createdAt: string | null
  url: string
  author: {
    name: string
    username: string
    profileImageUrl?: string
    verified: boolean
    verifiedType: 'blue' | 'business' | 'government' | 'none'
  }
  entities: {
    urls?: TwitterUrlEntity[]
    mentions?: TwitterMentionEntity[]
    hashtags?: TwitterTagEntity[]
    cashtags?: TwitterTagEntity[]
  }
  media: TwitterPostMedia[]
  metrics: {
    replies: number
    reposts: number
    likes: number
    views: number
  }
}

export type TwitterPostsResponse = {
  posts: TwitterPost[]
  nextToken: string | null
}

export type ExpandedMedia = {
  postId: string
  media: TwitterPostMedia
}
