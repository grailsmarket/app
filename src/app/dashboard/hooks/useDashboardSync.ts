import { useAccount } from 'wagmi'
import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { selectDashboard } from '@/state/reducers/dashboard/selectors'
import { getDashboardLayouts } from '@/api/dashboard/getDashboardLayouts'
import { hydrateFromServer, setDashboardLayoutId } from '@/state/reducers/dashboard'
import { createDashboardLayout, updateDashboardLayout } from '@/api/dashboard/saveDashboardLayout'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { Layout } from '@/api/dashboard/types'
import { deleteDashboardLayout } from '@/api/dashboard/deleteDashboardLayout'

export const useDashboardSync = () => {
  const dispatch = useAppDispatch()
  const { address: userAddress } = useAccount()
  const { subscription } = useAppSelector(selectUserProfile)
  const dashboard = useAppSelector(selectDashboard)
  const queryClient = useQueryClient()

  const loadLayout = async (layout: Layout) => {
    dispatch(
      hydrateFromServer({
        layoutId: layout.id,
        name: layout.name,
        layouts: layout.layouts,
        components: layout.components,
        nextId: layout.nextId,
        colOverride: layout.colOverride,
      })
    )
  }

  const { data: layouts, isLoading: isLoadingLayouts } = useQuery({
    queryKey: ['dashboard-layouts', userAddress, subscription?.tierId],
    queryFn: async () => {
      if (!userAddress) return null
      const layoutResponse = await getDashboardLayouts()

      // if (layoutResponse.length > 0) {
      //   // Use the default layout, or fall back to the first one
      //   const target = layoutResponse.find((l) => l.isDefault) || layoutResponse[0]
      //   if (target) loadLayout(target)
      //   else loadLayout(layoutResponse[0])
      // }

      return layoutResponse
    },
    enabled: !!userAddress && subscription.tierId >= 2,
  })

  // Save to API on state changes (debounced)
  const saveLayout = useCallback(async () => {
    const { layoutId, name, layouts, components, nextId, colOverride, isDefault } = dashboard
    const payload = { name, layouts, components, nextId, colOverride, isDefault }

    try {
      if (layoutId != null) {
        await updateDashboardLayout(layoutId, payload)
      } else {
        const created = await createDashboardLayout(payload)
        dispatch(setDashboardLayoutId(created.id))
      }
    } catch (err) {
      console.error('Failed to save dashboard layout:', err)
    }
  }, [dashboard])

  const removeLayout = useCallback(async () => {
    const { layoutId } = dashboard
    if (layoutId != null) {
      await deleteDashboardLayout(layoutId)
      const newQueryData = layouts?.filter((l) => l.id !== layoutId)
      if (newQueryData) {
        queryClient.setQueryData(['dashboard-layouts', userAddress, subscription?.tierId], newQueryData)
        loadLayout(newQueryData[0])
      } else {
        dispatch(setDashboardLayoutId(null))
      }
    }
  }, [dashboard, layouts, userAddress, subscription?.tierId, loadLayout])

  return {
    layouts,
    isLoadingLayouts,
    loadLayout,
    saveLayout,
    removeLayout,
  }
}
