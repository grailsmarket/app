'use client'

import React from 'react'
import { EmojiPicker } from 'frimousse'

interface Props {
  onPick: (emoji: string) => void
}

/**
 * Styled frimousse emoji picker. Loaded lazily via next/dynamic from
 * emojiPickerPopover — don't import this file directly.
 */
const FrimoussePicker: React.FC<Props> = ({ onPick }) => {
  return (
    <EmojiPicker.Root
      onEmojiSelect={({ emoji }) => onPick(emoji)}
      columns={8}
      className='bg-secondary border-tertiary flex h-80 w-72 flex-col rounded-md border-2 shadow-lg'
    >
      <EmojiPicker.Search
        autoFocus
        placeholder='Search emoji…'
        className='bg-background text-foreground placeholder:text-neutral text-md mx-2 mt-2 rounded-sm px-2 py-1.5 outline-none'
      />
      <EmojiPicker.Viewport className='relative flex-1 outline-none'>
        <EmojiPicker.Loading className='text-neutral absolute inset-0 flex items-center justify-center text-sm'>
          Loading…
        </EmojiPicker.Loading>
        <EmojiPicker.Empty className='text-neutral absolute inset-0 flex items-center justify-center text-sm'>
          No emoji found
        </EmojiPicker.Empty>
        <EmojiPicker.List
          className='pb-1.5 select-none'
          components={{
            CategoryHeader: ({ category, ...props }) => (
              <div className='bg-secondary text-neutral px-2 pt-3 pb-1.5 text-sm font-medium' {...props}>
                {category.label}
              </div>
            ),
            Row: ({ children, ...props }) => (
              <div className='scroll-my-1.5 px-1.5' {...props}>
                {children}
              </div>
            ),
            Emoji: ({ emoji, ...props }) => (
              <button
                className='data-[active]:bg-primary/15 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-xl'
                {...props}
              >
                {emoji.emoji}
              </button>
            ),
          }}
        />
      </EmojiPicker.Viewport>
    </EmojiPicker.Root>
  )
}

export default FrimoussePicker
