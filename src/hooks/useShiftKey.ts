import { useEffect } from 'react'
import { useAppDispatch } from '@/state/hooks'
import { setBulkSelectIsSelecting, setIsShiftPressed } from '@/state/reducers/modals/bulkSelectModal'

export const useShiftKeyListener = (canListen: boolean) => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift' && canListen) {
        dispatch(setBulkSelectIsSelecting(true))
        dispatch(setIsShiftPressed(true))
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift' && canListen) {
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
  }, [dispatch, canListen])
}
