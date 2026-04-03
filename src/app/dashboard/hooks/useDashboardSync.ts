import { useEffect, useRef, useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { selectDashboard } from '@/state/reducers/dashboard/selectors'
import { hydrateFromServer } from '@/state/reducers/dashboard'
import { getDashboardLayouts } from '@/api/dashboard/getDashboardLayouts'
import { createDashboardLayout, updateDashboardLayout } from '@/api/dashboard/saveDashboardLayout'

const SYNC_DEBOUNCE_MS = 2000

/**
 * Syncs dashboard state to/from the backend API.
 * - On mount: loads the user's default dashboard from the API and hydrates Redux.
 * - On state changes (debounced): saves the current state to the API.
 */
export const useDashboardSync = () => {
  const dispatch = useAppDispatch()
  const dashboard = useAppSelector(selectDashboard)

  const layoutIdRef = useRef<number | null>(null)
  const skipSyncRef = useRef(true) // Skip initial hydration + first render
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadedRef = useRef(false)

  // Load from API on mount
  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true

    const load = async () => {
      try {
        const layouts = await getDashboardLayouts()

        if (layouts.length > 0) {
          // Use the default layout, or fall back to the first one
          const target = layouts.find((l) => l.isDefault) || layouts[0]
          layoutIdRef.current = target.id

          // Prevent the upcoming state change from triggering a save
          skipSyncRef.current = true
          dispatch(
            hydrateFromServer({
              layouts: target.layouts,
              components: target.components,
              nextId: target.nextId,
              colOverride: target.colOverride,
            })
          )
        }
        // If no layouts exist, keep current Redux state (from localStorage).
        // A save will be triggered on the next user change, creating the first layout.
      } catch (err) {
        // API unavailable — fall back to localStorage state silently
        console.error('Failed to load dashboard layouts:', err)
      }
    }

    load()
  }, [dispatch])

  // Save to API on state changes (debounced)
  const save = useCallback(async () => {
    const { layouts, components, nextId, colOverride } = dashboard
    const payload = { layouts, components, nextId, colOverride }

    try {
      if (layoutIdRef.current != null) {
        await updateDashboardLayout(layoutIdRef.current, payload)
      } else {
        const created = await createDashboardLayout({
          name: 'Default',
          isDefault: true,
          ...payload,
        })
        layoutIdRef.current = created.id
      }
    } catch (err) {
      console.error('Failed to save dashboard layout:', err)
    }
  }, [dashboard])

  useEffect(() => {
    // Skip the sync triggered by initial hydration
    if (skipSyncRef.current) {
      skipSyncRef.current = false
      return
    }

    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current)
    }

    syncTimerRef.current = setTimeout(save, SYNC_DEBOUNCE_MS)

    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current)
      }
    }
  }, [dashboard.layouts, dashboard.components, dashboard.nextId, dashboard.colOverride, save])
}
