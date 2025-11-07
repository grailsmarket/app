import { useEffect, useState } from 'react'

interface UseScrollToBottomOptions {
  threshold?: number // Distance from bottom to trigger (in pixels)
  enabled?: boolean // Whether to track scroll position
}

const useScrollToBottom = ({ 
  threshold = 100, 
  enabled = true 
}: UseScrollToBottomOptions = {}) => {
  const [isAtBottom, setIsAtBottom] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setIsAtBottom(false)
      return
    }

    const handleScroll = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      
      // Check if we've scrolled to within threshold pixels of the bottom
      const atBottom = windowHeight + scrollTop >= documentHeight - threshold
      
      setIsAtBottom(atBottom)
    }

    // Check initial state
    handleScroll()

    // Add event listener
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [threshold, enabled])

  return isAtBottom
}

export default useScrollToBottom