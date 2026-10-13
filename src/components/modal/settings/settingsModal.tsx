'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter()
  useEffect(() => {
    if (!isOpen) return
    onClose()
    router.push('/settings/profile')
  }, [isOpen, onClose, router])
  return null
}
