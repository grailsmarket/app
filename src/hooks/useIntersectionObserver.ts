import { useEffect, useState } from 'react'

const useIntersectionObserver = ({
  rootMargin = '300px 0px 0px 0px',
  threshold = 0,
}: { rootMargin?: string; threshold?: number } = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [node, setNode] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      { rootMargin, threshold }
    )
    observer.observe(node)

    return () => observer.disconnect()
  }, [node, rootMargin, threshold])

  return {
    ref: setNode,
    isIntersecting,
  }
}

export default useIntersectionObserver
