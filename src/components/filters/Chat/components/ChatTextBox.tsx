import { CompactEmoji } from 'emojibase'

import { useChatBoxControls } from '../hooks/useChatBoxControls'

import EmojiSelect from './Emoji/EmojiSelect'
import GifSelect from './Gif/GifSelect'

interface ChatTextBoxProps {
  placeholderTab?: string
  emojis: CompactEmoji[] | undefined
}

const ChatTextBox: React.FC<ChatTextBoxProps> = ({ placeholderTab = '', emojis }) => {
  const { onInputChange, messageInput, onEmojiSelect } = useChatBoxControls()

  return (
    <div className='bg-dark-800 w-full p-4'>
      <div className='bg-dark-300 flex h-10 items-center justify-between gap-2 rounded-[4px] py-4 pr-2 pl-4'>
        <input
          className='text-light-100 placeholder:text-light-200 flex-1 bg-transparent text-xs outline-none'
          type='text'
          value={messageInput}
          onChange={onInputChange}
          placeholder={!placeholderTab ? 'Message' : `Message #${placeholderTab}`}
        />
        <div className='flex gap-2'>
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
