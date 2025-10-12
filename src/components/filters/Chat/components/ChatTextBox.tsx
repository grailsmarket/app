import { CompactEmoji } from 'emojibase'

import { useChatBoxControls } from '../hooks/useChatBoxControls'

import EmojiSelect from './Emoji/EmojiSelect'
import GifSelect from './Gif/GifSelect'

interface ChatTextBoxProps {
  placeholderTab?: string
  emojis: CompactEmoji[] | undefined
}

const ChatTextBox: React.FC<ChatTextBoxProps> = ({
  placeholderTab = '',
  emojis,
}) => {
  const { onInputChange, messageInput, onEmojiSelect } = useChatBoxControls()

  return (
    <div className="w-full bg-dark-800 p-4">
      <div className="flex h-10 items-center justify-between gap-2 rounded-[4px] bg-dark-300 py-4 pl-4 pr-2">
        <input
          className="flex-1 bg-transparent text-xs text-light-100 outline-none placeholder:text-light-200"
          type="text"
          value={messageInput}
          onChange={onInputChange}
          placeholder={
            !placeholderTab ? 'Message' : `Message #${placeholderTab}`
          }
        />
        <div className="flex gap-2">
          <GifSelect
          // onGifSelect={onGifSelect}
          />
          <EmojiSelect emojis={emojis} onEmojiSelect={onEmojiSelect} />
        </div>
      </div>
    </div>
  )
}

export default ChatTextBox
