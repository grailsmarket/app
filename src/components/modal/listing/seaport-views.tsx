import React from 'react'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { modalActionClassName, modalPrimaryActionClassName } from '@/components/ui/modal/modalShell'
import AssetSummary from '@/components/ui/modal/assetSummary'
import TxStatus from '@/components/ui/modal/txStatus'
import TxSteps, { type TxStep } from '@/components/ui/modal/txSteps'
import TxLink from '@/components/ui/modal/txLink'
import Notice from '@/components/ui/modal/notice'
import NameChips, { type NameChip } from '@/components/ui/modal/nameChips'
import type { TxState } from '@/components/ui/modal/statusOrb'
import NameImage from '@/components/ui/nameImage'
import { REGISTERED } from '@/constants/domains/registrationStatuses'
import { beautifyName } from '@/lib/ens'
import { KEEP_OPEN_HINT } from './seaport-progress'

// Presentational screens shared by the listing and offer modals (and the preview route).

export interface BusyScreen {
  status: { state: TxState; title: string; message?: React.ReactNode }
  steps: TxStep[]
  /** Names under the status, e.g. the listings being published. */
  chips?: NameChip[]
}

/** The keep-open hint, except while a wallet prompt is open: then the status already says what to do. */
export const getBusyHint = (screen: BusyScreen) => (screen.status.state === 'wallet' ? undefined : KEEP_OPEN_HINT)

export const BusyView: React.FC<{ screen: BusyScreen }> = ({ screen }) => (
  <>
    <TxStatus {...screen.status} />
    {screen.chips && screen.chips.length > 0 && <NameChips names={screen.chips} />}
    <TxSteps steps={screen.steps} />
  </>
)

export interface SuccessLink {
  key: string
  label: string
  hash: string
}

interface SuccessViewProps {
  title: string
  message: React.ReactNode
  links?: SuccessLink[]
  chips?: NameChip[]
}

export const SuccessView: React.FC<SuccessViewProps> = ({ title, message, links, chips }) => (
  <>
    <TxStatus state='success' title={title} message={message}>
      {links && links.length > 0 && (
        <div className='flex flex-wrap justify-center gap-1.5'>
          {links.map((link) => (
            <TxLink key={link.key} label={link.label} hash={link.hash} />
          ))}
        </div>
      )}
    </TxStatus>
    {chips && chips.length > 0 && <NameChips names={chips} />}
  </>
)

interface ErrorViewProps {
  title: string
  message?: string
  /** Part of the work went through: what is done and what retrying does. */
  warning?: { title: string; body?: React.ReactNode } | null
  error: string | null
  details?: string | null
}

export const ErrorView: React.FC<ErrorViewProps> = ({
  title,
  message = 'Review the details below and try again.',
  warning,
  error,
  details,
}) => (
  <>
    <TxStatus state='error' title={title} message={message} />
    {warning && (
      <Notice tone='warning' title={warning.title}>
        {warning.body}
      </Notice>
    )}
    <Notice tone='danger' details={details}>
      {error || 'An unknown error occurred'}
    </Notice>
  </>
)

export const CloseFooter: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <SecondaryButton onClick={onClose} className={modalActionClassName}>
    Close
  </SecondaryButton>
)

export const RetryFooter: React.FC<{ onRetry: () => void; onClose: () => void; retryLabel?: string }> = ({
  onRetry,
  onClose,
  retryLabel = 'Try Again',
}) => (
  <>
    <PrimaryButton onClick={onRetry} className={modalPrimaryActionClassName}>
      {retryLabel}
    </PrimaryButton>
    <SecondaryButton onClick={onClose} className={modalActionClassName}>
      Close
    </SecondaryButton>
  </>
)

export interface SubjectName {
  name: string
  tokenId?: string
  version?: number
  /** Leave out when unknown; the image then draws as a registered name. */
  expiryDate?: string | null
}

interface NameSubjectProps {
  names: SubjectName[]
  /** Several names: the summary's name, e.g. "5 names" or "3 listings". */
  label?: string
  compact?: boolean
  meta?: React.ReactNode
  price?: React.ReactNode
  priceSub?: React.ReactNode
}

const SubjectImage: React.FC<{ entry: SubjectName; size: number }> = ({ entry, size }) => (
  <NameImage
    name={entry.name}
    tokenId={entry.tokenId ?? ''}
    version={entry.version ?? 1}
    expiryDate={entry.expiryDate ?? null}
    forceRegStatus={entry.expiryDate === undefined ? REGISTERED : undefined}
    className='h-full w-full object-cover'
    height={size}
    width={size}
  />
)

/** The modal's subject: one name with its image, or several as a stack of the first three. */
export const NameSubject: React.FC<NameSubjectProps> = ({ names, label, compact, meta, price, priceSub }) => {
  const size = compact ? 40 : 48

  if (names.length > 1) {
    return (
      <AssetSummary
        name={label ?? `${names.length} names`}
        compact={compact}
        stack={names.slice(0, 3).map((entry, index) => (
          <SubjectImage key={`${entry.name}-${index}`} entry={entry} size={size} />
        ))}
        meta={meta}
        price={price}
        priceSub={priceSub}
      />
    )
  }

  const [entry] = names
  return (
    <AssetSummary
      name={entry ? beautifyName(entry.name) : ''}
      compact={compact}
      image={entry ? <SubjectImage entry={entry} size={size} /> : undefined}
      meta={meta}
      price={price}
      priceSub={priceSub}
    />
  )
}

/** A plain amount for the subject's price slot: "0.5 ETH". */
export const SubjectAmount: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className='text-xl font-bold tabular-nums'>{children}</p>
)
