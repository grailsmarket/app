'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useUserContext } from '@/context/user'

export const useOpenSettingsFromUrl = () => {
  const { setIsSettingsOpen } = useUserContext()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (searchParams.get('modal') !== 'settings') return

    setIsSettingsOpen(true)

    const params = new URLSearchParams(searchParams.toString())
    params.delete('modal')
    const rest = params.toString()
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    router.replace(`${pathname}${rest ? `?${rest}` : ''}${hash}`, { scroll: false })
  }, [searchParams, pathname, router, setIsSettingsOpen])
}
