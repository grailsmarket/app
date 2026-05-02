'use client'

import React, { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { closeChatSidebar, selectChatSidebar } from '@/state/reducers/chat/sidebar'
import ListView from './listView'
import NewChatView from './newChatView'
import ThreadView from './threadView'

const ChatSidebar: React.FC = () => {
  const dispatch = useAppDispatch()
  const { open, view } = useAppSelector(selectChatSidebar)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch(closeChatSidebar())
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, dispatch])

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
            className='bg-background border-tertiary fixed top-0 right-0 z-[91] flex h-[100dvh] w-full flex-col border-l-2 md:max-w-md'
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
