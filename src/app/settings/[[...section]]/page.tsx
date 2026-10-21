import type { Metadata } from 'next'
import SettingsPage from '@/components/settings/settingsPage'

export const metadata: Metadata = { title: 'Settings', robots: { index: false, follow: false } }
export default async function Page({ params }: { params: Promise<{ section?: string[] }> }) {
  const { section = [] } = await params
  return <SettingsPage section={section} />
}
