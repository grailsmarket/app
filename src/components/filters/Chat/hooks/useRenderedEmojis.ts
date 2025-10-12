import { useRef } from 'react'
import { CompactEmoji } from 'emojibase'

export const useRenderedEmojis = (shownEmojis: CompactEmoji[]) => {
  const emojiRenderRef = useRef<any>(null)

  // useEffect(() => {
  //   if (!emojiRenderRef) return
  //   twemoji.parse(emojiRenderRef.current)
  // }, [emojiRenderRef, shownEmojis])

  return { emojiRenderRef }
}
