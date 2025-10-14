import { useMemo, useState } from 'react'
import { CompactEmoji } from 'emojibase'

import supportsEmoji from '@/app/utils/supportsEmoji'

import { EMOJI_CATEGORIES_HEX } from '../../constants/chat'

export const useEmojiPanel = (emojis: CompactEmoji[]) => {
  const [selectedEmojiCategoryIndex, setSelectedEmojiCategoryIndex] = useState(0)

  const categorizedEmojis = useMemo(() => {
    return emojis.filter(
      (emoji) =>
        emoji.group === selectedEmojiCategoryIndex && supportsEmoji(emoji.unicode) && !emoji.hexcode.includes('-')
    )
  }, [selectedEmojiCategoryIndex, emojis])

  const onEmojiCategoryClick = (categoryIndex: number) => {
    setSelectedEmojiCategoryIndex(categoryIndex >= 2 ? categoryIndex + 1 : categoryIndex) // category 2 are some weird gray square emojis
  }

  const emojiCategories = useMemo(() => {
    return emojis.length ? emojis.filter((emoji) => EMOJI_CATEGORIES_HEX.includes(emoji.hexcode)) : []
  }, [emojis])

  return { categorizedEmojis, emojiCategories, onEmojiCategoryClick }
}
