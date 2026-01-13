import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { selectBulkSelect, setIsShiftPressed } from '@/state/reducers/modals/bulkSelectModal'

export const useShiftKeyListener = () => {
  const dispatch = useAppDispatch()
  const { isSelecting } = useAppSelector(selectBulkSelect)

  useEffect(() => {
    if (!isSelecting) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        dispatch(setIsShiftPressed(true))
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        dispatch(setIsShiftPressed(false))
      }
    }

    // Also handle window blur to reset shift state when user switches windows
    const handleBlur = () => {
      dispatch(setIsShiftPressed(false))
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
      dispatch(setIsShiftPressed(false))
    }
  }, [dispatch, isSelecting])
}
