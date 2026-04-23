import { useEffect, useRef } from 'react'
import { useAppSelector } from '@/state/hooks'
import { selectDashboard } from '@/state/reducers/dashboard/selectors'
import { updateDashboardLayout } from '@/api/dashboard/saveDashboardLayout'
import type { UpdateDashboardLayoutPayload } from '@/api/dashboard/types'

const AUTO_SAVE_DEBOUNCE_MS = 3000

export const useDashboardAutoSave = () => {
  const dashboard = useAppSelector(selectDashboard)
  const { layoutId, name, layouts, components, colOverride, isDefault } = dashboard

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedSnapshotRef = useRef<string | null>(null)
  const syncedLayoutIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (layoutId == null) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      syncedLayoutIdRef.current = null
      lastSavedSnapshotRef.current = null
      return
    }

    const payload: UpdateDashboardLayoutPayload = {
      name,
      layouts,
      components,
      colOverride,
      isDefault,
    }
    const snapshot = JSON.stringify(payload)

    if (syncedLayoutIdRef.current !== layoutId) {
      syncedLayoutIdRef.current = layoutId
      lastSavedSnapshotRef.current = snapshot
      return
    }

    if (lastSavedSnapshotRef.current === snapshot) return

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        await updateDashboardLayout(layoutId, payload)
        lastSavedSnapshotRef.current = snapshot
      } catch (err) {
        console.error('Failed to auto-save dashboard layout:', err)
      } finally {
        timerRef.current = null
      }
    }, AUTO_SAVE_DEBOUNCE_MS)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [layoutId, name, layouts, components, colOverride, isDefault])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])
}
