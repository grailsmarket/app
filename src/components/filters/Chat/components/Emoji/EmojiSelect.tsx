import Image from 'next/image'
import { CompactEmoji } from 'emojibase'

import { useEmojiControls } from '../../hooks/Emoji/useEmojiControls'

import EmojiSelectPanel from './EmojiSelectPanel'

import Emoji from '@/public/svg/chat/emoji.svg'

interface EmojiSelectProps {
  emojis: CompactEmoji[] | undefined
  onEmojiSelect: (unicode: string) => void
}

const EmojiSelect: React.FC<EmojiSelectProps> = ({ emojis, onEmojiSelect }) => {
  const { onToggleEmojiPanel, showEmojiModal, clickHandleRef } = useEmojiControls()

  return (
    <div className='relative flex items-center' ref={clickHandleRef}>
      <button onClick={onToggleEmojiPanel}>
        <Image src={Emoji} alt='emoji icon' />
      </button>
      <EmojiSelectPanel show={showEmojiModal} onEmojiSelect={onEmojiSelect} emojis={emojis} />
    </div>
  )
}
export default EmojiSelect
