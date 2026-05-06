'use client'

import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { closeChatSidebar, selectChatSidebar } from '@/state/reducers/chat/sidebar'
import NewChatView from './components/new-chat/newChatView'
import ThreadView from './components/chat/threadView'
import ListView from './components/listView'

const ChatSidebar: React.FC = () => {
  const dispatch = useAppDispatch()
  const { open, view } = useAppSelector(selectChatSidebar)
  const [viewport, setViewport] = useState<{ height: number; offsetTop: number } | null>(null)

  // Close on Escape
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key='chat-sidebar-overlay'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className='fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm'
          onClick={() => dispatch(closeChatSidebar())}
        >
          <motion.aside
            key='chat-sidebar-panel'
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            style={viewport ? { height: `${viewport.height}px`, top: `${viewport.offsetTop}px` } : undefined}
            className={`bg-background border-tertiary fixed right-0 z-[91] flex w-full flex-col border-l-2 transition-[height,top] duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] md:max-w-md ${viewport ? '' : 'top-0 h-dvh'}`}
            aria-label='Chat sidebar'
          >
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
