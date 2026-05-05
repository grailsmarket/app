import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'

export type ChatSidebarView = 'list' | 'new' | 'thread'

type ChatSidebarState = {
  open: boolean
  view: ChatSidebarView
  /** UUID of the currently-open chat in 'thread' view */
  activeChatId: string | null
  /** Pre-fills the recipient input on the 'new' view */
  presetRecipient: string | null
}

const initialState: ChatSidebarState = {
  open: false,
  view: 'list',
  activeChatId: null,
  presetRecipient: null,
}

export const chatSidebarSlice = createSlice({
  name: 'chatSidebar',
  initialState,
  reducers: {
    openChatSidebar(state) {
      state.open = true
      // Don't reset view here — caller may have set it via openSidebarToNew/Thread first
    },
    closeChatSidebar(state) {
      state.open = false
      // Keep view/activeChatId so reopening returns to where the user left off,
      // unless explicitly reset.
    },
    setChatSidebarView(state, { payload }: PayloadAction<ChatSidebarView>) {
      state.view = payload
    },
    openSidebarToList(state) {
      state.open = true
      state.view = 'list'
      state.activeChatId = null
      state.presetRecipient = null
    },
    openSidebarToNew(state, { payload }: PayloadAction<{ recipient?: string } | undefined>) {
      state.open = true
      state.view = 'new'
      state.activeChatId = null
      state.presetRecipient = payload?.recipient ?? null
    },
    openSidebarToThread(state, { payload }: PayloadAction<{ chatId: string }>) {
      state.open = true
      state.view = 'thread'
      state.activeChatId = payload.chatId
      state.presetRecipient = null
    },
    clearPresetRecipient(state) {
      state.presetRecipient = null
    },
  },
})

export const {
  openChatSidebar,
  closeChatSidebar,
  setChatSidebarView,
  openSidebarToList,
  openSidebarToNew,
  openSidebarToThread,
  clearPresetRecipient,
} = chatSidebarSlice.actions

export const selectChatSidebar = (state: RootState) => state.chat.sidebar

export default chatSidebarSlice.reducer
