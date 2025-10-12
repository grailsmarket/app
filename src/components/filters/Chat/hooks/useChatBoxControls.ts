import { useState } from 'react'

export const useChatBoxControls = () => {
  const [messageInput, setMessageInput] = useState('')

  const onEmojiSelect = (unicode: string) => {
    setMessageInput((prev) => prev + unicode.toString())
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value)
  }

  return {
    messageInput,
    onEmojiSelect,
    onInputChange,
  }
}
