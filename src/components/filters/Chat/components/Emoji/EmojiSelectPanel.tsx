import { CompactEmoji } from 'emojibase'

import { useRenderedEmojis } from '../../hooks/useRenderedEmojis'
import { useEmojiPanel } from '../../hooks/Emoji/useEmojiPanel'

interface EmojiSelectPanelProps {
  emojis: CompactEmoji[] | undefined
  onEmojiSelect: (unicode: string) => void
  show: boolean
}

const EmojiSelectPanel: React.FC<EmojiSelectPanelProps> = ({ emojis, onEmojiSelect, show }) => {
  const { categorizedEmojis, emojiCategories, onEmojiCategoryClick } = useEmojiPanel(emojis || [])
  const { emojiRenderRef } = useRenderedEmojis(categorizedEmojis)

  return (
    <div
      // ref={emojiRenderRef}
      className={`bg-dark-600 absolute right-0 bottom-full h-48 w-60 -translate-y-2 flex-col gap-4 px-2 py-4 ${
        show ? 'flex' : 'hidden'
      }`}
    >
      <div className='flex w-full items-center justify-evenly'>
        {!emojis ? (
          <div>Loading</div> // temporary until designs
        ) : (
          emojiCategories.map((emoji, index) => {
            return (
              <button
                onClick={() => onEmojiCategoryClick(index)}
                className='max-h-[20px] max-w-[20px] flex-1'
                key={index}
              >
                {emoji.unicode}
              </button>
            )
          })
        )}
      </div>
      <div
        className='grid w-full flex-1 gap-1 overflow-x-hidden overflow-y-scroll'
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(20px, 1fr))',
        }}
      >
        {categorizedEmojis.map((emoji, index) => {
          return (
            <button onClick={() => onEmojiSelect(emoji.unicode)} className='max-w-[20px]' key={index}>
              {emoji.unicode}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default EmojiSelectPanel
