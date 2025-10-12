import { useEffect, useRef, useState } from 'react'

export const useEmojiControls = () => {
  const [showEmojiModal, setShowEmojiModal] = useState(false)
  const clickHandleRef = useRef<any>(null)

  const onToggleEmojiPanel = () => {
    setShowEmojiModal((prev) => !prev)
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!clickHandleRef) return
      if (
        clickHandleRef.current &&
        !clickHandleRef.current.contains(e.target)
      ) {
        setShowEmojiModal(false)
      }
    }
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [showEmojiModal])

  return {
    onToggleEmojiPanel,
    showEmojiModal,
    clickHandleRef,
  }
}
