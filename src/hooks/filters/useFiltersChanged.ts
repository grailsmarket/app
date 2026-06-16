'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Tracks whether a filter state has changed since the panel was opened.
 *
 * A baseline is snapshotted when `isOpen` flips true, the current state is
 * compared against it on every change, and everything resets when the panel
 * closes (so each open re-baselines). Purely a UI affordance — e.g. enabling an
 * "Apply" button — since these filters already apply live; it gates nothing.
 *
 * `current` is serialized for comparison, so pass plain serializable filter
 * values and omit volatile UI fields (e.g. `open`/`scrollTop`) at the call site.
 */
export function useFiltersChanged(isOpen: boolean, current: unknown): boolean {
  const serialized = JSON.stringify(current)
  const baselineRef = useRef<string | null>(null)
  const [changed, setChanged] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      baselineRef.current = null
      setChanged(false)
      return
    }
    if (baselineRef.current === null) {
      baselineRef.current = serialized
      setChanged(false)
    } else {
      setChanged(serialized !== baselineRef.current)
    }
  }, [isOpen, serialized])

  return changed
}
