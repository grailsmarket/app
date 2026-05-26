import React from 'react'
import type { TwitterMentionEntity, TwitterPost, TwitterTagEntity, TwitterUrlEntity } from '../types'
import { sliceByCodePoints } from '../utils'

export const PostText: React.FC<{ post: TwitterPost }> = ({ post }) => {
  const entities = [
    ...(post.entities.urls ?? []).map((entity) => ({ ...entity, kind: 'url' as const })),
    ...(post.entities.mentions ?? []).map((entity) => ({ ...entity, kind: 'mention' as const })),
    ...(post.entities.hashtags ?? []).map((entity) => ({ ...entity, kind: 'hashtag' as const })),
    ...(post.entities.cashtags ?? []).map((entity) => ({ ...entity, kind: 'cashtag' as const })),
  ].sort((a, b) => a.start - b.start)

  if (entities.length === 0) return <>{post.text}</>

  const parts: React.ReactNode[] = []
  let cursor = 0

  for (const entity of entities) {
    if (entity.start < cursor) continue

    const plainText = sliceByCodePoints(post.text, cursor, entity.start)
    if (plainText) parts.push(<React.Fragment key={`text-${cursor}`}>{plainText}</React.Fragment>)

    if (entity.kind === 'url' && entity.media_key) {
      cursor = entity.end
      continue
    }

    parts.push(<EntityLink key={`${entity.kind}-${entity.start}`} entity={entity} text={post.text} />)
    cursor = entity.end
  }

  const remainingText = sliceByCodePoints(post.text, cursor, Array.from(post.text).length)
  if (remainingText) parts.push(<React.Fragment key='text-end'>{remainingText}</React.Fragment>)

  return <>{parts}</>
}

const EntityLink: React.FC<{
  entity:
    | (TwitterUrlEntity & { kind: 'url' })
    | (TwitterMentionEntity & { kind: 'mention' })
    | (TwitterTagEntity & { kind: 'hashtag' | 'cashtag' })
  text: string
}> = ({ entity, text }) => {
  if (entity.kind === 'url') {
    return (
      <a
        href={entity.expanded_url ?? entity.url}
        target='_blank'
        rel='noreferrer'
        className='text-[#1d9bf0] hover:underline'
      >
        {entity.display_url ?? entity.url}
      </a>
    )
  }

  if (entity.kind === 'mention') {
    return (
      <a
        href={`https://x.com/${entity.username}`}
        target='_blank'
        rel='noreferrer'
        className='text-[#1d9bf0] hover:underline'
      >
        @{entity.username}
      </a>
    )
  }

  const prefix = entity.kind === 'hashtag' ? '#' : '$'
  return (
    <a
      href={`https://x.com/search?q=${encodeURIComponent(`${prefix}${entity.tag}`)}`}
      target='_blank'
      rel='noreferrer'
      className='text-[#1d9bf0] hover:underline'
    >
      {sliceByCodePoints(text, entity.start, entity.end)}
    </a>
  )
}
