import { useEffect } from 'react'
import { useAppSelector } from '@/state/hooks'
import { selectActivityConfig } from '@/state/reducers/dashboard/selectors'
import { useDashboardActivityContext } from '../context/DashboardActivityProvider'

export const useDashboardActivity = (instanceId: string) => {
  const config = useAppSelector((state) => selectActivityConfig(state, instanceId))
  const { subscribe, unsubscribe, getEvents, isConnected } = useDashboardActivityContext()

  useEffect(() => {
    if (!config) return
    subscribe(instanceId, config.eventTypes)
    return () => unsubscribe(instanceId)
  }, [instanceId, config?.eventTypes, subscribe, unsubscribe])

  return {
    events: getEvents(instanceId),
    isConnected,
  }
}
