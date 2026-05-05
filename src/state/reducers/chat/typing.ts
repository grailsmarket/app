import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'

/** Map of chatId → array of user ids currently typing. */
type TypingState = {
  byChat: Record<string, number[]>
}

const initialState: TypingState = {
  byChat: {},
}

export const typingSlice = createSlice({
  name: 'chatTyping',
  initialState,
  reducers: {
    setTyping(state, { payload }: PayloadAction<{ chatId: string; userId: number }>) {
      const { chatId, userId } = payload
      const list = state.byChat[chatId] ?? []
      if (!list.includes(userId)) {
        state.byChat[chatId] = [...list, userId]
      }
    },
    clearTyping(state, { payload }: PayloadAction<{ chatId: string; userId: number }>) {
      const { chatId, userId } = payload
      const list = state.byChat[chatId]
      if (!list) return
      const next = list.filter((id) => id !== userId)
      if (next.length === 0) delete state.byChat[chatId]
      else state.byChat[chatId] = next
    },
    clearAllTyping() {
      return initialState
    },
  },
})

export const { setTyping, clearTyping, clearAllTyping } = typingSlice.actions

export const selectTypingForChat =
  (chatId: string | null) =>
  (state: RootState): number[] =>
    chatId ? (state.chat.typing.byChat[chatId] ?? []) : []

export default typingSlice.reducer
