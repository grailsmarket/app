'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useUserContext } from '@/context/user'

export const useOpenSettingsFromUrl = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { setIsSettingsOpen } = useUserContext()
  const hasHandledRef = useRef(false)

  useEffect(() => {
    if (hasHandledRef.current) return
    if (searchParams.get('modal') !== 'settings') return

    hasHandledRef.current = true
    setIsSettingsOpen(true)

    const params = new URLSearchParams(searchParams.toString())
    params.delete('modal')
    const rest = params.toString()
    router.replace(rest ? `${pathname}?${rest}` : pathname, { scroll: false })
  }, [searchParams, pathname, router, setIsSettingsOpen])
}
