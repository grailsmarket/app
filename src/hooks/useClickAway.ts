import { useEffect, useLayoutEffect, useRef } from 'react'

export const useClickAway = <T extends HTMLElement>(callback: () => void) => {
  const ref = useRef<T>(null)
  const refCb = useRef(callback)

  useLayoutEffect(() => {
    refCb.current = callback
  })

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      const element = ref.current
      // @ts-expect-error - ref will be valid upon this call
      if (element && !element.contains(e.target)) {
        // @ts-expect-error - refCb will be valid upon this call
        refCb.current(e)
      }
    }

    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)

    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [])

  return ref
}
