'use client'

import { useSyncExternalStore } from 'react'
import type { Address } from 'viem'

export const MIGRATION_REWARD_ID = 'ens-commemorative'

const STORAGE_PREFIX = 'grails:ens-commemorative:dismissed:'
const CHANGE_EVENT = 'grails:ens-commemorative:visibility'
const fallback = new Map<string, boolean>()
const storageKey = (owner: Address) => `${STORAGE_PREFIX}${owner.toLowerCase()}`

const subscribe = (listener: () => void) => {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && !event.key.startsWith(STORAGE_PREFIX)) return
    if (event.key === null) fallback.clear()
    else fallback.delete(event.key)
    listener()
  }
  window.addEventListener(CHANGE_EVENT, listener)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener)
    window.removeEventListener('storage', onStorage)
  }
}

export const setMigrationRewardDismissed = (owner: Address, dismissed: boolean) => {
  if (typeof window === 'undefined') return
  const key = storageKey(owner)
  try {
    if (dismissed) window.localStorage.setItem(key, 'true')
    else window.localStorage.removeItem(key)
    fallback.delete(key)
  } catch {
    fallback.set(key, dismissed)
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

const isDismissed = (owner: Address) => {
  const key = storageKey(owner)
  if (fallback.has(key)) return fallback.get(key)!
  try {
    return window.localStorage.getItem(key) === 'true'
  } catch {
    return false
  }
}

export const useMigrationRewardDismissed = (owner: Address) =>
  useSyncExternalStore(
    subscribe,
    () => isDismissed(owner),
    () => true
  )
