import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/state'

interface SettingsNavigationBlock {
  dirty: boolean
  pending: boolean
  changes: number
}

interface SettingsNavigationDestination {
  url: string
  historyKey?: string
}

interface SettingsNavigationState {
  blocks: Record<string, SettingsNavigationBlock>
  destination: SettingsNavigationDestination | null
}

const initialState: SettingsNavigationState = {
  blocks: {},
  destination: null,
}

const settingsNavigationSlice = createSlice({
  name: 'settingsNavigation',
  initialState,
  reducers: {
    setSettingsNavigationBlock: (state, { payload }: PayloadAction<SettingsNavigationBlock & { id: string }>) => {
      const { id, dirty, pending, changes } = payload

      if (dirty || pending) state.blocks[id] = { dirty, pending, changes }
      else delete state.blocks[id]
    },
    removeSettingsNavigationBlock: (state, { payload }: PayloadAction<string>) => {
      delete state.blocks[payload]
    },
    setSettingsNavigationDestination: (state, { payload }: PayloadAction<SettingsNavigationDestination | null>) => {
      state.destination = payload
    },
    resetSettingsNavigation: () => initialState,
  },
})

export const {
  setSettingsNavigationBlock,
  removeSettingsNavigationBlock,
  setSettingsNavigationDestination,
  resetSettingsNavigation,
} = settingsNavigationSlice.actions

export const selectSettingsNavigation = (state: RootState) => state.settings.navigation

export const selectSettingsNavigationBlocked = (state: RootState) =>
  Object.keys(state.settings.navigation.blocks).length > 0

export const selectSettingsNavigationPending = (state: RootState) =>
  Object.values(state.settings.navigation.blocks).some((block) => block.pending)

export const selectSettingsNavigationChangeCount = (state: RootState) =>
  Object.values(state.settings.navigation.blocks).reduce((total, block) => total + block.changes, 0)

export default settingsNavigationSlice.reducer
