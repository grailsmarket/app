import { useEffect, useRef, useState } from 'react'

export const useGifControls = () => {
  const [showGifModal, setShowGifModal] = useState(false)
  const clickHandleRef = useRef<any>(null)

  const onToggleGifPanel = () => {
    setShowGifModal((prev) => !prev)
  }

  const onGifSelect = () => {}

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!clickHandleRef) return
      if (
        clickHandleRef.current &&
        !clickHandleRef.current.contains(e.target)
      ) {
        setShowGifModal(false)
      }
    }
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [showGifModal])

  return {
    onGifSelect,
    showGifModal,
    onToggleGifPanel,
    clickHandleRef,
  }
}
