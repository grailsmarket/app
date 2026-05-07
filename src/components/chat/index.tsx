'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { closeChatSidebar, selectChatSidebar } from '@/state/reducers/chat/sidebar'
import NewChatView from './components/new-chat/newChatView'
import ThreadView from './components/chat/threadView'
import ListView from './components/listView'

const MIN_WIDTH = 448

const ChatSidebar: React.FC = () => {
  const dispatch = useAppDispatch()
  const { open, view } = useAppSelector(selectChatSidebar)
  const [viewport, setViewport] = useState<{ height: number; offsetTop: number } | null>(null)
  const [isDesktop, setIsDesktop] = useState(false)
  const [width, setWidth] = useState<number | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const justResizedRef = useRef(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch(closeChatSidebar())
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, dispatch])

  useEffect(() => {
    if (!open) return
    if (typeof window === 'undefined' || !window.visualViewport) return
    const vv = window.visualViewport
    const update = () => setViewport({ height: vv.height, offsetTop: vv.offsetTop })
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [open])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(min-width: 768px)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // Clamp width if the viewport shrinks below the current width
  useEffect(() => {
    if (typeof window === 'undefined' || width === null) return
    const onResize = () => {
      setWidth((prev) => (prev === null ? prev : Math.min(prev, window.innerWidth)))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [width])

  useEffect(() => {
    if (!isResizing) return

    const onMove = (e: PointerEvent) => {
      const next = window.innerWidth - e.clientX
      setWidth(Math.max(MIN_WIDTH, Math.min(window.innerWidth, next)))
    }

    const onUp = () => {
      setIsResizing(false)
      justResizedRef.current = true

      setTimeout(() => {
        justResizedRef.current = false
      }, 0)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)

    const prevCursor = document.body.style.cursor
    const prevSelect = document.body.style.userSelect

    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      document.body.style.cursor = prevCursor
      document.body.style.userSelect = prevSelect
    }
  }, [isResizing])

  const onResizeStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
  }, [])

  const widthStyle = isDesktop && width !== null ? { width: `${width}px`, maxWidth: `${width}px` } : undefined

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key='chat-sidebar-overlay'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className='fixed inset-0 z-90 bg-black/40 backdrop-blur-sm'
          onClick={() => {
            if (justResizedRef.current) return
            dispatch(closeChatSidebar())
          }}
        >
          <motion.aside
            key='chat-sidebar-panel'
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            style={{
              ...(viewport ? { height: `${viewport.height}px`, top: `${viewport.offsetTop}px` } : {}),
              ...widthStyle,
            }}
            className={`bg-background border-tertiary fixed right-0 z-91 flex w-full flex-col border-l-2 transition-[height,top] duration-250 ease-[cubic-bezier(0.32,0.72,0,1)] md:max-w-md ${viewport ? '' : 'top-0 h-dvh'}`}
            aria-label='Chat sidebar'
          >
            <div
              role='separator'
              aria-orientation='vertical'
              aria-label='Resize chat sidebar'
              onPointerDown={onResizeStart}
              className={`absolute top-0 -left-1 z-20 hidden h-full w-2 cursor-ew-resize touch-none md:block ${isResizing ? 'bg-primary/40' : 'hover:bg-primary/30'
                } transition-colors`}
            />
            {view === 'list' && <ListView />}
            {view === 'new' && <NewChatView />}
            {view === 'thread' && <ThreadView />}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ChatSidebar
