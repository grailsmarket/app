'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { useAppDispatch, useAppSelector, useAppStore } from '@/state/hooks'
import {
  resetSettingsNavigation,
  selectSettingsNavigation,
  selectSettingsNavigationBlocked,
  selectSettingsNavigationPending,
  selectSettingsNavigationChangeCount,
  setSettingsNavigationDestination,
} from '@/state/reducers/settings/navigation'

type HistoryNavigation = EventTarget & {
  traverseTo: (key: string) => { committed: Promise<unknown>; finished: Promise<unknown> }
}
type HistoryNavigateEvent = Event & {
  navigationType: string
  destination: { url: string; key: string; sameDocument: boolean }
}
const historyNavigation = () => (window as Window & { navigation?: HistoryNavigation }).navigation

interface SettingsNavigationGuardProps {
  children: ReactNode
}

export const SettingsNavigationGuard = ({ children }: SettingsNavigationGuardProps) => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const store = useAppStore()
  const { destination } = useAppSelector(selectSettingsNavigation)
  const pending = useAppSelector(selectSettingsNavigationPending)
  const changeCount = useAppSelector(selectSettingsNavigationChangeCount)
  const dialog = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!destination) return

    const previous = document.activeElement as HTMLElement | null
    dialog.current?.focus()

    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopImmediatePropagation()
        dispatch(setSettingsNavigationDestination(null))
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
  }, [destination, dispatch])

  useEffect(() => {
    // Read the store at event time so a recent edit or transaction update is never missed.
    const isBlocked = () => selectSettingsNavigationBlocked(store.getState())

    const unload = (event: BeforeUnloadEvent) => {
      if (!isBlocked()) return
      event.preventDefault()
      event.returnValue = ''
    }

    const click = (event: MouseEvent) => {
      if (
        !isBlocked() ||
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
      dispatch(setSettingsNavigationDestination({ url: target.href }))
    }

    // Cancel same-document Back/Forward before the router unmounts the draft. Preserve the
    // original history entry so confirming navigation does not add a duplicate entry.
    const navigation = historyNavigation()
    const navigate = (event: Event) => {
      const entry = event as HistoryNavigateEvent
      if (
        !isBlocked() ||
        !event.cancelable ||
        entry.navigationType !== 'traverse' ||
        !entry.destination.sameDocument ||
        entry.destination.url === window.location.href
      )
        return
      event.preventDefault()
      dispatch(setSettingsNavigationDestination({ url: entry.destination.url, historyKey: entry.destination.key }))
    }
    window.addEventListener('beforeunload', unload)
    document.addEventListener('click', click, true)
    navigation?.addEventListener('navigate', navigate)

    return () => {
      window.removeEventListener('beforeunload', unload)
      document.removeEventListener('click', click, true)
      navigation?.removeEventListener('navigate', navigate)
      dispatch(resetSettingsNavigation())
    }
  }, [store, dispatch])

  const discardChanges = () => {
    const state = store.getState()
    const { destination } = selectSettingsNavigation(state)

    if (!destination || selectSettingsNavigationPending(state)) return

    const target = new URL(destination.url)
    dispatch(resetSettingsNavigation())

    const navigation = historyNavigation()

    if (destination.historyKey && navigation) {
      const result = navigation.traverseTo(destination.historyKey)
      void Promise.all([result.committed, result.finished]).catch(() => window.location.assign(target.href))
    } else if (target.origin === window.location.origin) router.push(`${target.pathname}${target.search}${target.hash}`)
    else window.location.assign(target.href)
  }

  return (
    <>
      {children}
      {destination && (
        <div
          className='fixed inset-0 z-110 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm'
          onClick={() => dispatch(setSettingsNavigationDestination(null))}
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
              <SecondaryButton className='w-full' onClick={() => dispatch(setSettingsNavigationDestination(null))}>
                Continue editing
              </SecondaryButton>
              {!pending && (
                <PrimaryButton className='w-full' onClick={discardChanges}>
                  Discard changes
                </PrimaryButton>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
