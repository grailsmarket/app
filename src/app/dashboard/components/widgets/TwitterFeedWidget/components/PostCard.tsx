import React from 'react'
import formatTimeAgo from '@/utils/time/formatTimeAgo'
import type { TwitterPost, TwitterPostMedia } from '../types'
import { LikeIcon, ReplyIcon, RepostIcon, ViewIcon } from './Icons'
import { Metric } from './Metric'
import { PostMedia } from './PostMedia'
import { PostText } from './PostText'
import { VerifiedBadge } from './VerifiedBadge'

export const PostCard: React.FC<{ post: TwitterPost; onExpandMedia: (media: TwitterPostMedia) => void }> = ({
  post,
  onExpandMedia,
}) => (
  <article className='border-b border-[#2f3336] px-4 py-3 transition-colors hover:bg-[#080808]'>
    <div className='flex gap-3'>
      <a href={`https://x.com/${post.author.username}`} target='_blank' rel='noreferrer' className='shrink-0'>
        {post.author.profileImageUrl ? (
          <img
            src={post.author.profileImageUrl}
            alt=''
            className='h-10 w-10 rounded-full object-cover'
            loading='lazy'
          />
        ) : (
          <div className='h-10 w-10 rounded-full bg-[#333639]' />
        )}
      </a>

      <div className='min-w-0 flex-1'>
        <div className='flex min-w-0 items-center gap-1 text-[15px] leading-5'>
          <a
            href={`https://x.com/${post.author.username}`}
            target='_blank'
            rel='noreferrer'
            className='truncate font-bold text-[#e7e9ea] hover:underline'
          >
            {post.author.name}
          </a>
          {post.author.verified && <VerifiedBadge type={post.author.verifiedType} />}
          <span className='truncate text-[#71767b]'>@{post.author.username}</span>
          {post.createdAt && <span className='text-[#71767b]'>·</span>}
          {post.createdAt && (
            <a href={post.url} target='_blank' rel='noreferrer' className='shrink-0 text-[#71767b] hover:underline'>
              {formatTimeAgo(post.createdAt).replace(' ago', '')}
            </a>
          )}
        </div>

        <div className='text-[15px] leading-5 break-words whitespace-pre-wrap text-[#e7e9ea]'>
          <PostText post={post} />
        </div>

        {post.media.length > 0 && <PostMedia postId={post.id} media={post.media} onExpand={onExpandMedia} />}

        <div className='mt-3 grid max-w-[425px] grid-cols-4 text-[#71767b]'>
          <Metric
            href={post.url}
            icon={<ReplyIcon />}
            value={post.metrics.replies}
            hoverClass='group-hover:text-[#1d9bf0]'
          />
          <Metric
            href={post.url}
            icon={<RepostIcon />}
            value={post.metrics.reposts}
            hoverClass='group-hover:text-[#00ba7c]'
          />
          <Metric
            href={post.url}
            icon={<LikeIcon />}
            value={post.metrics.likes}
            hoverClass='group-hover:text-[#f91880]'
          />
          <Metric
            href={post.url}
            icon={<ViewIcon />}
            value={post.metrics.views}
            hoverClass='group-hover:text-[#1d9bf0]'
          />
        </div>
      </div>
    </div>
  </article>
)
