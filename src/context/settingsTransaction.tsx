'use client'

import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import SettingsTransactionModal, { type SettingsTransactionModalProps } from '@/components/settings/transactionModal'

interface SettingsTransactionContextValue {
  publish: (id: string, transaction: SettingsTransactionModalProps | null) => void
}

interface SettingsTransactionProviderProps {
  children: React.ReactNode
}

interface SettingsTransactionDialogOptions extends SettingsTransactionModalProps {
  open: boolean
}

const SettingsTransactionContext = createContext<SettingsTransactionContextValue | null>(null)

export const SettingsTransactionProvider: React.FC<SettingsTransactionProviderProps> = ({ children }) => {
  const [active, setActive] = useState<{ id: string; transaction: SettingsTransactionModalProps } | null>(null)
  const publish = useCallback((id: string, transaction: SettingsTransactionModalProps | null) => {
    setActive((previous) => (transaction ? { id, transaction } : previous?.id === id ? null : previous))
  }, [])

  return (
    <SettingsTransactionContext.Provider value={{ publish }}>
      <div className='contents' inert={!!active}>
        {children}
      </div>
      {active && <SettingsTransactionModal key={active.id} {...active.transaction} />}
    </SettingsTransactionContext.Provider>
  )
}

export const useSettingsTransactionDialog = ({
  open,
  phase,
  title,
  networkName,
  status,
  error,
  explorerUrl,
  progress,
  submitted,
  onRetry,
  onClose,
}: SettingsTransactionDialogOptions) => {
  const context = useContext(SettingsTransactionContext)
  const id = useId()
  const callbacks = useRef({ onRetry, onClose })

  if (!context) throw new Error('Settings transactions require SettingsTransactionProvider.')

  const { publish } = context
  const current = progress?.current
  const total = progress?.total

  useLayoutEffect(() => {
    callbacks.current = { onRetry, onClose }
  })

  useLayoutEffect(() => {
    publish(
      id,
      open
        ? {
            phase,
            title,
            networkName,
            status,
            error,
            explorerUrl,
            progress: current !== undefined && total !== undefined ? { current, total } : undefined,
            submitted,
            onRetry: () => callbacks.current.onRetry(),
            onClose: () => callbacks.current.onClose(),
          }
        : null
    )
  }, [publish, id, open, phase, title, networkName, status, error, explorerUrl, current, total, submitted])

  useEffect(() => () => publish(id, null), [publish, id])
}
