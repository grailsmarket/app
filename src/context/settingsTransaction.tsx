'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { AnimatePresence } from 'motion/react'
import SettingsTransactionModal, { type SettingsTransactionModalProps } from '@/components/settings/transactionModal'

interface SettingsTransactionContextValue {
  publish: (id: string, transaction: SettingsTransactionModalProps | null) => void
}

interface SettingsTransactionProviderProps {
  inline?: boolean
  children: React.ReactNode
}

interface SettingsTransactionDialogOptions extends SettingsTransactionModalProps {
  open: boolean
}

const SettingsTransactionContext = createContext<SettingsTransactionContextValue | null>(null)

export const SettingsTransactionProvider: React.FC<SettingsTransactionProviderProps> = ({
  inline = false,
  children,
}) => {
  const [active, setActive] = useState<{ id: string; transaction: SettingsTransactionModalProps } | null>(null)
  const publish = useCallback((id: string, transaction: SettingsTransactionModalProps | null) => {
    setActive((previous) => (transaction ? { id, transaction } : previous?.id === id ? null : previous))
  }, [])
  const value = useMemo(() => ({ publish }), [publish])
  const overlay = inline ? null : active

  return (
    <SettingsTransactionContext.Provider value={value}>
      <div className='contents' inert={!!overlay}>
        {children}
      </div>
      <AnimatePresence>
        {overlay && <SettingsTransactionModal key={overlay.id} {...overlay.transaction} />}
      </AnimatePresence>
    </SettingsTransactionContext.Provider>
  )
}

export const useSettingsTransactionDialog = ({
  open,
  phase,
  title,
  label,
  networkName,
  status,
  error,
  details,
  hash,
  explorerUrl,
  progress,
  steps,
  index,
  successTitle,
  successMessage,
  errorTitle,
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
            label,
            networkName,
            status,
            error,
            details,
            hash,
            explorerUrl,
            progress: current !== undefined && total !== undefined ? { current, total } : undefined,
            steps,
            index,
            successTitle,
            successMessage,
            errorTitle,
            submitted,
            onRetry: () => callbacks.current.onRetry(),
            onClose: () => callbacks.current.onClose(),
          }
        : null
    )
  }, [
    publish,
    id,
    open,
    phase,
    title,
    label,
    networkName,
    status,
    error,
    details,
    hash,
    explorerUrl,
    current,
    total,
    steps,
    index,
    successTitle,
    successMessage,
    errorTitle,
    submitted,
  ])

  useEffect(() => () => publish(id, null), [publish, id])
}
