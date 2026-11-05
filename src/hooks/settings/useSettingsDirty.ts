import { useEffect, useId } from 'react'
import { useAppDispatch } from '@/state/hooks'
import { removeSettingsNavigationBlock, setSettingsNavigationBlock } from '@/state/reducers/settings/navigation'

export const useSettingsDirty = (dirty: boolean, pending = false, changes = 0) => {
  const id = useId()
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(setSettingsNavigationBlock({ id, dirty, pending, changes }))
  }, [id, dirty, pending, changes, dispatch])

  useEffect(() => {
    return () => {
      dispatch(removeSettingsNavigationBlock(id))
    }
  }, [id, dispatch])
}
