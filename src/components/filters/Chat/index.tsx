import { CompactEmoji } from 'emojibase'

import { useChannelSelect } from './hooks/useChannelSelect'

import Messages from './components/Messages'
import ChatTextBox from './components/ChatTextBox'
import ChannelSelect from './components/ChannelSelect'

interface ChatProps {
  emojis: CompactEmoji[] | undefined
}

const Chat: React.FC<ChatProps> = ({ emojis }) => {
  const { handleDropdownChange, selectedOption, selectedCategories } = useChannelSelect()

  return (
    <div className='flex flex-1 flex-col justify-between overflow-y-hidden bg-[#111218]'>
      <ChannelSelect
        handleDropdownChange={handleDropdownChange}
        selectedOption={selectedOption}
        filterCategories={selectedCategories}
      />
      <div className='flex h-full w-full flex-col gap-px overflow-y-hidden'>
        <Messages />
        <ChatTextBox placeholderTab={selectedOption.value} emojis={emojis} />
      </div>
    </div>
  )
}

export default Chat
