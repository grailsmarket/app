'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export const useOpenSettingsFromUrl = () => {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    if (searchParams.get('modal') !== 'settings') return

    router.replace('/settings/profile')
  }, [searchParams, router])
}
