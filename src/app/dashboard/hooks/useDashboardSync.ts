import { useAccount } from 'wagmi'
import { useCallback, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { selectDashboard } from '@/state/reducers/dashboard/selectors'
import { getDashboardLayouts } from '@/api/dashboard/getDashboardLayouts'
import { hydrateFromServer, resetDashboard, setDashboardLayoutId } from '@/state/reducers/dashboard'
import { createDashboardLayout, updateDashboardLayout } from '@/api/dashboard/saveDashboardLayout'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { Layout } from '@/api/dashboard/types'
// import { deleteDashboardLayout } from '@/api/dashboard/deleteDashboardLayout'

export const useDashboardSync = () => {
  const dispatch = useAppDispatch()
  const { address: userAddress } = useAccount()
  const { subscription } = useAppSelector(selectUserProfile)
  const dashboard = useAppSelector(selectDashboard)
  const queryClient = useQueryClient()
  const [selectedLayoutId, setSelectedLayoutId] = useState<number | null>(dashboard.layoutId)

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
    setSelectedLayoutId(layout.id)
  }

  const { data: layouts, isLoading: isLoadingLayouts } = useQuery({
    queryKey: ['dashboard-layouts', userAddress, subscription?.tierId],
    queryFn: async () => {
      if (!userAddress) return null
      const layoutResponse = await getDashboardLayouts()

      if (!!layoutResponse) {
        // Only load a layout from the response if the one persisted in the redux store is not in the response array
        if (layoutResponse.findIndex((layout) => layout.id === dashboard.layoutId) === -1) {
          // Use the default layout, or fall back to the first one in the response array
          const target = layoutResponse.find((l) => l.isDefault) || layoutResponse[0]
          if (target) {
            loadLayout(target)
          } else {
            if (layoutResponse[0]) {
              loadLayout(layoutResponse[0])
            } else {
              setSelectedLayoutId(null)
              dispatch(resetDashboard())
            }
          }
        }
      }

      return layoutResponse
    },
    enabled: !!userAddress && subscription.tierId >= 2,
  })

  // Save to API on state changes (debounced)
  const saveLayout = useCallback(
    async (newName?: string, isNewDefault?: boolean) => {
      const { layoutId, name, layouts: dashboardLayouts, components, nextId, colOverride, isDefault } = dashboard
      const payload = {
        name: newName || name,
        layouts: dashboardLayouts,
        components,
        nextId,
        colOverride,
        isDefault: isNewDefault || isDefault,
      }

      try {
        if (layoutId != null) {
          const updated = await updateDashboardLayout(layoutId, payload)

          const newQueryData = layouts?.map((l) => (l.id === layoutId ? updated : l))
          if (newQueryData) {
            queryClient.setQueryData(['dashboard-layouts', userAddress, subscription?.tierId], newQueryData)
          }

          loadLayout(updated)
          setSelectedLayoutId(updated.id)

          return {
            success: true,
            message: 'Dashboard layout updated',
          }
        } else {
          const created = await createDashboardLayout(payload)
          if (!created) {
            return {
              success: false,
              error: 'Failed to create dashboard layout',
              message: 'Failed to create dashboard layout',
            }
          }

          dispatch(setDashboardLayoutId(created.id))

          if (created.isDefault) {
            const newQueryData = [...(layouts || []).map((l) => ({ ...l, isDefault: false })), created]
            queryClient.setQueryData(['dashboard-layouts', userAddress, subscription?.tierId], newQueryData)
          } else {
            const newQueryData = [...(layouts || []), created]
            queryClient.setQueryData(['dashboard-layouts', userAddress, subscription?.tierId], newQueryData)
          }

          loadLayout(created)
          setSelectedLayoutId(created.id)

          return {
            success: true,
            message: 'Dashboard layout created',
          }
        }
      } catch (err) {
        console.error('Failed to save dashboard layout:', err)
        return {
          success: false,
          error: 'Failed to save dashboard layout',
          message: err,
        }
      }
    },
    [dashboard]
  )

  const removeLayout = useCallback(async () => {
    const { layoutId } = dashboard
    try {
      if (layoutId != null) {
        // const response = await deleteDashboardLayout(layoutId)
        const newQueryData = layouts?.filter((l) => l.id !== layoutId)
        if (newQueryData && newQueryData.length > 0) {
          queryClient.setQueryData(['dashboard-layouts', userAddress, subscription?.tierId], newQueryData)
          loadLayout(newQueryData[0])
          setSelectedLayoutId(newQueryData[0].id)
        } else {
          dispatch(resetDashboard())
          dispatch(setDashboardLayoutId(null))
          setSelectedLayoutId(null)
        }

        return {
          success: true,
          message: 'Dashboard layout deleted',
        }
      } else {
        return {
          success: false,
          error: 'No layout to delete',
          message: 'No layout to delete',
        }
      }
    } catch (err) {
      console.error('Failed to remove dashboard layout:', err)
      return {
        success: false,
        error: 'Failed to remove dashboard layout',
        message: err,
      }
    }
  }, [dashboard, layouts, userAddress, subscription?.tierId, loadLayout])

  return {
    layouts,
    isLoadingLayouts,
    loadLayout,
    saveLayout,
    removeLayout,
    selectedLayoutId,
    setSelectedLayoutId,
  }
}
