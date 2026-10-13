import SettingsShell from '@/components/settings/settingsShell'
import type { ReactNode } from 'react'

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <SettingsShell>{children}</SettingsShell>
}
