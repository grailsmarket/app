'use client'

import { useEffect, useRef, useState } from 'react'
import type { Container } from '@tsparticles/engine'
import { SnowProfile, startSnowfall, snowThemeProfile } from './snowfall'
import { usePathname } from 'next/navigation'

const WinterSnow = () => {
  const host = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const [profile, setProfile] = useState<SnowProfile | null>(null)

  useEffect(() => {
    const sync = () => {
      const themeProfile = snowThemeProfile(pathname)
      setProfile(themeProfile)
    }

    sync()
    window.addEventListener('resize', sync)
    return () => {
      window.removeEventListener('resize', sync)
    }
  }, [pathname])

  useEffect(() => {
    const element = host.current
    if (!element || !profile) return

    let disposed = false
    let snow: Container | undefined

    const start = async () => {
      if (disposed) return
      snow = await startSnowfall(element, profile)
      if (disposed) snow?.destroy()
    }

    start().catch((error) => console.error('Unable to start winter snow', error))
    return () => {
      disposed = true
      snow?.destroy()
    }
  }, [profile])

  return profile ? <div ref={host} aria-hidden='true' className='pointer-events-none fixed inset-0 -z-10' /> : null
}

export default WinterSnow
