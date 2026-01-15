import { useEffect } from 'react'
import { useAppDispatch } from '@/state/hooks'
import { setSearchModalOpen } from '@/state/reducers/modals/searchModal'

/**
 * Global keyboard shortcut hook for opening the search modal.
 * Press "/" to open the global search modal from anywhere in the app.
 * The shortcut is ignored when the user is typing in an input field.
 */
export const useGlobalSearchShortcut = () => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input field
      const activeElement = document.activeElement
      const isInputField =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute('contenteditable') === 'true'

      if (isInputField) return

      // "/" (slash): Open global search modal
      if (e.key === '/') {
        e.preventDefault()
        dispatch(setSearchModalOpen(true))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dispatch])
}
