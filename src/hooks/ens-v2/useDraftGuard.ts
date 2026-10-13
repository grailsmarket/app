'use client'

import { useEffect, useId } from 'react'

const drafts = new Map<string, 'dirty' | 'busy'>()
const checkedNavigation = new WeakSet<Event>()
export function confirmLeavingRecords() {
  if (Array.from(drafts.values()).includes('busy')) return false
  return drafts.size === 0 || window.confirm('Discard the unsaved record changes?')
}
export function useDraftGuard(dirty: boolean, busy: boolean) {
  const id = useId()
  useEffect(() => {
    if (busy || dirty) drafts.set(id, busy ? 'busy' : 'dirty')
    else drafts.delete(id)
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (busy || dirty) event.preventDefault()
    }
    const navigate = (event: MouseEvent) => {
      if (event.defaultPrevented || checkedNavigation.has(event)) return
      const link = (event.target as Element)?.closest('a[href]')
      if (link && (busy || dirty)) checkedNavigation.add(event)
      if (
        link &&
        link.getAttribute('target') !== '_blank' &&
        link.getAttribute('href') !== window.location.pathname &&
        (busy || dirty) &&
        !confirmLeavingRecords()
      ) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    window.addEventListener('beforeunload', beforeUnload)
    document.addEventListener('click', navigate, true)
    return () => {
      drafts.delete(id)
      window.removeEventListener('beforeunload', beforeUnload)
      document.removeEventListener('click', navigate, true)
    }
  }, [dirty, busy, id])
}
