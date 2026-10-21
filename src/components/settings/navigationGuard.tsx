'use client'

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'

const NavigationContext = createContext<(id: string, dirty: boolean, pending: boolean, changes: number) => void>(
  () => {}
)

type HistoryNavigation = EventTarget & {
  traverseTo: (key: string) => { committed: Promise<unknown>; finished: Promise<unknown> }
}
type HistoryNavigateEvent = Event & {
  navigationType: string
  destination: { url: string; key: string; sameDocument: boolean }
}
const historyNavigation = () => (window as Window & { navigation?: HistoryNavigation }).navigation

export const SettingsNavigationGuard = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter()
  const blocks = useRef(new Map<string, { dirty: boolean; pending: boolean; changes: number }>())
  const [destination, setDestination] = useState<{ url: string; historyKey?: string } | null>(null)
  const dialog = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!destination) return

    const previous = document.activeElement as HTMLElement | null
    dialog.current?.focus()

    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopImmediatePropagation()
        setDestination(null)
      }

      if (event.key === 'Tab') {
        const buttons = dialog.current?.querySelectorAll('button')
        if (!buttons?.length) return

        if (event.shiftKey && (document.activeElement === buttons[0] || document.activeElement === dialog.current)) {
          event.preventDefault()
          buttons[buttons.length - 1].focus()
        } else if (!event.shiftKey && document.activeElement === buttons[buttons.length - 1]) {
          event.preventDefault()
          buttons[0].focus()
        }
      }
    }
    document.addEventListener('keydown', keydown, true)
    return () => {
      document.removeEventListener('keydown', keydown, true)
      previous?.focus()
    }
  }, [destination])

  const register = useCallback((id: string, dirty: boolean, pending: boolean, changes: number) => {
    if (dirty || pending) blocks.current.set(id, { dirty, pending, changes })
    else blocks.current.delete(id)
  }, [])

  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => {
      if (!blocks.current.size) return
      event.preventDefault()
      event.returnValue = ''
    }

    const click = (event: MouseEvent) => {
      if (
        !blocks.current.size ||
        event.defaultPrevented ||
        event.button ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return

      const link =
        event.target instanceof Element ? (event.target.closest('a[href]') as HTMLAnchorElement | null) : null
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return

      const target = new URL(link.href)
      if (target.href === window.location.href) return

      event.preventDefault()
      event.stopPropagation()
      setDestination({ url: target.href })
    }

    // Cancel same-document Back/Forward before the router unmounts the draft. Preserve the
    // original history entry so confirming navigation does not add a duplicate entry.
    const navigation = historyNavigation()
    const navigate = (event: Event) => {
      const entry = event as HistoryNavigateEvent
      if (
        !blocks.current.size ||
        !event.cancelable ||
        entry.navigationType !== 'traverse' ||
        !entry.destination.sameDocument ||
        entry.destination.url === window.location.href
      )
        return
      event.preventDefault()
      setDestination({ url: entry.destination.url, historyKey: entry.destination.key })
    }
    window.addEventListener('beforeunload', unload)
    document.addEventListener('click', click, true)
    navigation?.addEventListener('navigate', navigate)

    return () => {
      window.removeEventListener('beforeunload', unload)
      document.removeEventListener('click', click, true)
      navigation?.removeEventListener('navigate', navigate)
    }
  }, [])

  const pending = [...blocks.current.values()].some((block) => block.pending)
  const changeCount = [...blocks.current.values()].reduce((total, block) => total + block.changes, 0)

  return (
    <NavigationContext.Provider value={register}>
      {children}
      {destination && (
        <div
          className='fixed inset-0 z-110 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm'
          onClick={() => setDestination(null)}
        >
          <div
            ref={dialog}
            tabIndex={-1}
            role='alertdialog'
            aria-modal='true'
            aria-labelledby='settings-discard-title'
            aria-describedby='settings-discard-description'
            className='bg-background border-tertiary flex w-full max-w-md flex-col gap-4 rounded-md border-2 p-6 outline-none'
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id='settings-discard-title' className='text-xl font-bold'>
              {pending ? 'Transaction in progress' : 'Discard changes?'}
            </h2>
            <p id='settings-discard-description' className='text-neutral text-lg'>
              {pending
                ? 'Finish checking the submitted transaction before leaving this page.'
                : changeCount
                  ? `Leaving this page will discard ${changeCount} pending ${changeCount === 1 ? 'change' : 'changes'}.`
                  : 'Leaving this page will discard your unsaved changes.'}
            </p>
            <div className='flex flex-col gap-2 pt-2'>
              <SecondaryButton className='w-full' onClick={() => setDestination(null)}>
                Continue editing
              </SecondaryButton>
              {!pending && (
                <PrimaryButton
                  className='w-full'
                  onClick={() => {
                    const target = new URL(destination.url)
                    blocks.current.clear()
                    setDestination(null)
                    const navigation = historyNavigation()
                    if (destination.historyKey && navigation) {
                      const result = navigation.traverseTo(destination.historyKey)
                      void Promise.all([result.committed, result.finished]).catch(() =>
                        window.location.assign(target.href)
                      )
                    } else if (target.origin === window.location.origin)
                      router.push(`${target.pathname}${target.search}${target.hash}`)
                    else window.location.assign(target.href)
                  }}
                >
                  Discard changes
                </PrimaryButton>
              )}
            </div>
          </div>
        </div>
      )}
    </NavigationContext.Provider>
  )
}

export const useSettingsDirty = (dirty: boolean, pending = false, changes = 0) => {
  const id = useId()
  const register = useContext(NavigationContext)

  useEffect(() => {
    register(id, dirty, pending, changes)
    return () => register(id, false, false, 0)
  }, [id, dirty, pending, changes, register])
}
