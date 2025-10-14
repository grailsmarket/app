import { useEffect, useRef, useState } from 'react'

const useIntersectionObserver = ({
  rootMargin = '300px 0px 0px 0px ',
  threshold = 0,
}: { rootMargin?: string; threshold?: number } = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref || !ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      { rootMargin, threshold }
    )
    observer.observe(ref.current)

    return () => observer.disconnect()
  }, [isIntersecting, ref, rootMargin, threshold])

  return {
    ref,
    isIntersecting,
  }
}

export default useIntersectionObserver
