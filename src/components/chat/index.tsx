'use client'

import React, { useCallback, useEffect, useState, useRef } from 'react'
import { AnimatePresence, motion, useDragControls, type PanInfo, type Variants } from 'motion/react'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { closeChatSidebar, selectChatSidebar, type ChatSidebarView } from '@/state/reducers/chat/sidebar'
import { useNavbar } from '@/context/navbar'
import { cn } from '@/utils/tailwind'
import NewChatView from './components/new-chat/newChatView'
import ThreadView from './components/chat/threadView'
import GlobalThreadView from './components/global/globalThreadView'
import ListView from './components/listView'

const MIN_WIDTH = 360
const DEFAULT_WIDTH = 380

// Swipe-to-close (mobile): a deliberate left-to-right drag dismisses the panel.
// Thresholds are kept intentionally high so a stray horizontal nudge while
// scrolling can't close it by accident.
const SWIPE_CLOSE_DISTANCE = 90 // px of rightward drag that dismisses outright
const SWIPE_CLOSE_VELOCITY = 500 // px/s rightward flick that dismisses with less distance
const SWIPE_CLOSE_MIN_FLICK_DISTANCE = 40 // px floor so a tiny twitch never counts as a flick
const EDGE_SWIPE_ZONE = 48
const EDGE_NAV_GUARD_ZONE = 24

const VIEW_DEPTH: Record<ChatSidebarView, number> = {
  list: 0,
  new: 1,
  thread: 2,
  global: 3,
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

  const dragControls = useDragControls()

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

  // Start the swipe only when the gesture begins near the panel's left edge, so a
  // touch can land anywhere vertically yet mid-panel horizontal moves stay with
  // the content. The whole panel still drags once the gesture is under way.
  const onEdgePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (isDesktop) return
      const left = e.currentTarget.getBoundingClientRect().left
      if (e.clientX - left > EDGE_SWIPE_ZONE) return
      dragControls.start(e)
    },
    [isDesktop, dragControls]
  )

  // A far-enough or fast-enough rightward swipe closes the sidebar, regardless of
  // which view is showing. If the threshold isn't met Framer springs it back.
  const onSwipeEnd = useCallback(
    (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const shouldClose =
        info.offset.x > SWIPE_CLOSE_DISTANCE ||
        (info.velocity.x > SWIPE_CLOSE_VELOCITY && info.offset.x > SWIPE_CLOSE_MIN_FLICK_DISTANCE)
      if (shouldClose) dispatch(closeChatSidebar())
    },
    [dispatch]
  )

  useEffect(() => {
    if (!open || isDesktop) return
    const html = document.documentElement
    const { body } = document
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      overscroll: html.style.overscrollBehavior,
      htmlTouchAction: html.style.touchAction,
      bodyTouchAction: body.style.touchAction,
    }
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    html.style.overscrollBehavior = 'none'
    html.style.touchAction = 'pan-y'
    body.style.touchAction = 'pan-y'
    return () => {
      html.style.overflow = prev.htmlOverflow
      body.style.overflow = prev.bodyOverflow
      html.style.overscrollBehavior = prev.overscroll
      html.style.touchAction = prev.htmlTouchAction
      body.style.touchAction = prev.bodyTouchAction
    }
  }, [open, isDesktop])

  // iOS/Safari swipe disable
  useEffect(() => {
    if (!open || isDesktop) return
    const onTouchStart = (e: TouchEvent) => {
      if (!e.cancelable) return
      const x = e.touches[0]?.clientX
      if (x === undefined) return
      if (x < EDGE_NAV_GUARD_ZONE || x > window.innerWidth - EDGE_NAV_GUARD_ZONE) {
        e.preventDefault()
      }
    }
    document.addEventListener('touchstart', onTouchStart, { passive: false })
    return () => document.removeEventListener('touchstart', onTouchStart)
  }, [open, isDesktop])

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
          // Mobile only: an edge swipe to the right goes back / dismisses. We start
          // the drag manually (dragListener=false + onPointerDown) so it only fires
          // from the left-edge zone, while the whole panel moves once it's started.
          // Locked to the horizontal axis (vertical scrolling of the chat is
          // unaffected) and to the rightward direction (left elastic 0 — the panel
          // can't be pulled further onscreen).
          drag={isDesktop ? false : 'x'}
          dragControls={dragControls}
          dragListener={false}
          dragDirectionLock
          dragMomentum={false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={{ left: 0, right: 0.9 }}
          onDragEnd={onSwipeEnd}
          onPointerDown={isDesktop ? undefined : onEdgePointerDown}
          style={{
            // With dragListener=false Framer no longer sets this for us; `pan-y`
            // lets the browser keep vertical scrolling while handing horizontal
            // gestures to our edge swipe (otherwise the browser eats the gesture
            // as a scroll and the drag never starts).
            ...(!isDesktop ? { touchAction: 'pan-y' } : {}),
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
              {view === 'global' && <GlobalThreadView />}
            </motion.div>
          </AnimatePresence>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

export default ChatSidebar
