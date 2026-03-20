import { useRef, useState, useCallback } from 'react'

const DRAG_THRESHOLD = 5

interface DragState {
  active: boolean
  hasMoved: boolean
  startX: number
  startY: number
  offsetX: number
  offsetY: number
  width: number
  height: number
}

const useDraggable = (onClick: () => void) => {
  const ref = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState>({
    active: false,
    hasMoved: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    width: 0,
    height: 0,
  })
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return

    e.preventDefault()
    el.setPointerCapture(e.pointerId)

    const rect = el.getBoundingClientRect()
    dragRef.current = {
      active: true,
      hasMoved: false,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    }
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag.active) return

    if (!drag.hasMoved) {
      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return
      drag.hasMoved = true
      setIsDragging(true)
    }

    const x = Math.max(0, Math.min(e.clientX - drag.offsetX, window.innerWidth - drag.width))
    const y = Math.max(0, Math.min(e.clientY - drag.offsetY, window.innerHeight - drag.height))
    setPosition({ x, y })
  }, [])

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current
      const wasDragged = drag.hasMoved
      drag.active = false
      drag.hasMoved = false
      setIsDragging(false)

      if (!wasDragged) {
        onClick()
      }
    },
    [onClick]
  )

  return { ref, position, isDragging, onPointerDown, onPointerMove, onPointerUp }
}

export default useDraggable
