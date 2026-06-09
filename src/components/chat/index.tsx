'use client'

import React, { useCallback, useEffect, useState, useRef } from 'react'
import { AnimatePresence, motion, type Variants } from 'motion/react'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { closeChatSidebar, selectChatSidebar, type ChatSidebarView } from '@/state/reducers/chat/sidebar'
import { useNavbar } from '@/context/navbar'
import { cn } from '@/utils/tailwind'
import NewChatView from './components/new-chat/newChatView'
import ThreadView from './components/chat/threadView'
import ListView from './components/listView'

const MIN_WIDTH = 360
const DEFAULT_WIDTH = 380

const VIEW_DEPTH: Record<ChatSidebarView, number> = {
  list: 0,
  new: 1,
  thread: 2,
}

const viewVariants: Variants = {
  initial: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 16 : -16,
  }),
  animate: {
    opacity: 1,
    x: 0,
    transition: { type: 'tween', duration: 0.2, ease: [0, 0, 0.58, 1] },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -16 : 16,
    transition: { type: 'tween', duration: 0.2, ease: [0, 0, 0.58, 1] },
  }),
}

const ChatSidebar: React.FC = () => {
  const dispatch = useAppDispatch()
  const { open, view } = useAppSelector(selectChatSidebar)
  const { isNavbarVisible } = useNavbar()
  const [viewport, setViewport] = useState<{ height: number; offsetTop: number } | null>(null)
  const [isDesktop, setIsDesktop] = useState(false)
  const [width, setWidth] = useState<number | null>(null)
  const [isResizing, setIsResizing] = useState(false)

  const prevViewRef = useRef<ChatSidebarView>(view)
  const direction = VIEW_DEPTH[view] > VIEW_DEPTH[prevViewRef.current] ? 1 : -1

  useEffect(() => {
    prevViewRef.current = view
  }, [view])

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

  const sidebarWidth = width ?? DEFAULT_WIDTH
  const widthStyle = isDesktop ? { width: `${sidebarWidth}px`, maxWidth: `${sidebarWidth}px` } : undefined

  useEffect(() => {
    document.documentElement.style.setProperty('--chat-sidebar-width', open && isDesktop ? `${sidebarWidth}px` : '0px')
  }, [open, isDesktop, sidebarWidth])

  useEffect(() => {
    document.documentElement.style.setProperty('--chat-sidebar-anim-duration', isResizing ? '0ms' : '250ms')
  }, [isResizing])

  useEffect(
    () => () => {
      document.documentElement.style.removeProperty('--chat-sidebar-width')
      document.documentElement.style.removeProperty('--chat-sidebar-anim-duration')
    },
    []
  )

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key='chat-sidebar-panel'
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          // Keep in sync with the app-content offset transition (providers + feed): same 250ms + curve.
          transition={{ type: 'tween', duration: 0.25, ease: [0, 0, 0.58, 1] }}
          style={{
            ...(!isDesktop && viewport ? { height: `${viewport.height}px`, top: `${viewport.offsetTop}px` } : {}),
            ...widthStyle,
          }}
          className={cn(
            'bg-background border-tertiary app:right-[calc((100%-2340px)/2)] app:border-r-2 fixed right-0 z-91 flex w-full flex-col border-l-2 transition-[height,top] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] md:z-40',
            isNavbarVisible ? 'md:top-[72px] md:h-[calc(100dvh-72px)]' : 'md:top-0 md:h-dvh',
            !isDesktop && viewport ? '' : 'max-md:top-0 max-md:h-dvh'
          )}
          aria-label='Chat sidebar'
        >
          <div
            role='separator'
            aria-orientation='vertical'
            aria-label='Resize chat sidebar'
            onPointerDown={onResizeStart}
            className={`absolute top-0 -left-1 z-20 hidden h-full w-2 cursor-ew-resize touch-none md:block ${isResizing ? 'bg-primary/40' : 'hover:bg-primary/30'} transition-colors`}
          />
          <AnimatePresence initial={false} mode='wait' custom={direction}>
            <motion.div
              key={view}
              custom={direction}
              variants={viewVariants}
              initial='initial'
              animate='animate'
              exit='exit'
              className='flex h-full w-full flex-col overflow-hidden'
            >
              {view === 'list' && <ListView />}
              {view === 'new' && <NewChatView />}
              {view === 'thread' && <ThreadView />}
            </motion.div>
          </AnimatePresence>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

export default ChatSidebar
