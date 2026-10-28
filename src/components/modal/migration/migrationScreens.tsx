'use client'

import React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Check } from 'ethereum-identity-kit'
import { activeChain } from '@/constants/web3/chain'
import NameImage from '@/components/ui/nameImage'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import AssetSummary from '@/components/ui/modal/assetSummary'
import Notice from '@/components/ui/modal/notice'
import TxStatus from '@/components/ui/modal/txStatus'
import { MODAL_EASE_OUT, modalActionClassName, modalPrimaryActionClassName } from '@/components/ui/modal/modalShell'
import {
  KEEP_OPEN_HINT,
  TransactionFailure,
  TransactionLinks,
  TransactionProgress,
  TransactionUnconfirmed,
  confirmedTransactions,
  currentStepLabel,
  isTransactionBusy,
  isWalletPrompt,
  sentTransactionCount,
  type SettingsTransactionView,
} from '@/components/settings/transactionScreens'

export const MIGRATION_TITLE = 'Migrate to ENS V2'

interface MigrationSubjectProps {
  name: string
  /** The name has migrated: its image and badge read V2 from here on. */
  migrated: boolean
  compact?: boolean
  inProgress?: boolean
}

export const MigrationSubject: React.FC<MigrationSubjectProps> = ({ name, migrated, compact, inProgress }) => (
  <AssetSummary
    name={name}
    compact={compact}
    meta={`${activeChain.name} · ENS V1 → V2`}
    badge={
      <span className='bg-tertiary text-foreground inline-flex h-4.5 shrink-0 items-center rounded-sm px-1.25 text-sm font-bold'>
        {migrated ? 'V2' : 'V1'}
      </span>
    }
    image={
      <NameImage
        name={name}
        tokenId=''
        version={migrated ? 2 : 1}
        expiryDate={null}
        forceRegStatus='Registered'
        className='h-full w-full'
        width={inProgress ? 40 : 48}
        height={inProgress ? 40 : 48}
      />
    }
  />
)

interface MigrationSuccessProps {
  name: string
  message: string
  links: ReturnType<typeof confirmedTransactions>
}

// One name: its card with the success mark on the corner, as registration shows it.
const MigrationSuccess: React.FC<MigrationSuccessProps> = ({ name, message, links }) => {
  const reduceMotion = useReducedMotion()

  return (
    <div role='status' aria-live='polite' className='flex flex-col items-center gap-3 pt-2 text-center'>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className='relative my-3'
      >
        <div className='pointer-events-none absolute inset-[-40%] rounded-full bg-[radial-gradient(circle,var(--primary-glow)_0%,transparent_70%)]' />
        <div className='relative'>
          <NameImage
            name={name}
            tokenId=''
            version={2}
            expiryDate={null}
            forceRegStatus='Registered'
            className='shadow-modal h-39 w-39 rounded-lg'
            width={156}
            height={156}
          />
        </div>
        <motion.span
          initial={reduceMotion ? false : { scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.42, ease: MODAL_EASE_OUT }}
          className='bg-primary text-background border-background shadow-bulk absolute -right-3 -bottom-3 grid h-10 w-10 place-items-center rounded-full border-3'
        >
          <Check className='h-4 w-4' />
        </motion.span>
      </motion.div>
      <h3 className='text-2xl font-bold'>Migration Complete</h3>
      <p className='text-neutral -mt-1.5 max-w-80 text-lg'>{message}</p>
      <TransactionLinks links={links} />
    </div>
  )
}

export interface MigrationTransactionScreenProps {
  name: string
  /** The queue's state, or null while it is idle. */
  view: SettingsTransactionView | null
  migrated: boolean
  complete: boolean
  /** The name kept its Public Resolver, so its records were restored in PublicResolverV2 after migrating. */
  restoresRecords: boolean
  /** Records were copied or linked, so the V2 editor has something to open. */
  canOpenRecords: boolean
  /** Continues the queue where it stopped: the retry and the check of a submitted transaction. */
  onRetry: () => void
  /** Clears the queue and goes back to the form. */
  onReset: () => void
  /** Queues the record restore again once the queue has been cleared after migrating. */
  onFinishRecords: () => void
  /** Closes the migration, asking first when work would be discarded. */
  onClose: () => void
  onOpenRecords: () => void
}

export interface MigrationTransactionScreen {
  key: string
  locked: boolean
  subject: React.ReactNode
  content: React.ReactNode
  footer?: React.ReactNode
  footerHint?: React.ReactNode
}

/** The migration's busy, success and error screens, shown in the migration modal itself. Null shows the review. */
export const migrationTransactionScreen = ({
  name,
  view,
  migrated,
  complete,
  restoresRecords,
  canOpenRecords,
  onRetry,
  onReset,
  onFinishRecords,
  onClose,
  onOpenRecords,
}: MigrationTransactionScreenProps): MigrationTransactionScreen | null => {
  const subject = (
    <MigrationSubject name={name} migrated={migrated} compact inProgress={!!view && isTransactionBusy(view)} />
  )

  if (view && isTransactionBusy(view))
    return {
      key: 'progress',
      locked: true,
      subject,
      content: <TransactionProgress view={view} title={MIGRATION_TITLE} />,
      footerHint: isWalletPrompt(view) ? undefined : KEEP_OPEN_HINT,
    }

  if (complete || view?.phase === 'success')
    return {
      key: 'success',
      locked: false,
      subject: null,
      content: (
        <MigrationSuccess
          name={name}
          message={
            restoresRecords
              ? `${name} is now managed through ENS V2, with its records in PublicResolverV2.`
              : `${name} is now managed through ENS V2. Your wallet remains its owner.`
          }
          links={view ? confirmedTransactions(view) : []}
        />
      ),
      footer: (
        <>
          {canOpenRecords && (
            <PrimaryButton className={modalPrimaryActionClassName} onClick={onOpenRecords}>
              Open V2 Records
            </PrimaryButton>
          )}
          <SecondaryButton className={modalActionClassName} onClick={onClose}>
            Close
          </SecondaryButton>
        </>
      ),
    }

  if (view?.phase === 'error' && view.submitted)
    return {
      key: 'unconfirmed',
      locked: true,
      subject,
      content: <TransactionUnconfirmed view={view} />,
      footer: (
        <>
          <PrimaryButton className={modalPrimaryActionClassName} onClick={onRetry}>
            Check Transaction
          </PrimaryButton>
          <SecondaryButton className={modalActionClassName} disabled>
            Close
          </SecondaryButton>
        </>
      ),
    }

  // After the migration only the record restore can be left. Retrying never migrates the name again.
  if (migrated)
    return {
      key: 'restore',
      locked: false,
      subject,
      content: (
        <>
          <TxStatus
            state='error'
            title='Records Not Restored'
            message={`${name} has migrated. Its records still need to be restored in PublicResolverV2.`}
          />
          <Notice tone='warning' title='Keep this window open to finish the remaining transaction.'>
            Retrying will not migrate your name again.
            {view && <TransactionLinks links={confirmedTransactions(view)} single='Migration' inline />}
          </Notice>
          {view?.error && (
            <Notice tone='danger' details={view.details}>
              {view.error}
            </Notice>
          )}
        </>
      ),
      footer: (
        <>
          <PrimaryButton
            className={modalPrimaryActionClassName}
            onClick={view?.phase === 'error' ? onRetry : onFinishRecords}
          >
            Finish Copying Records
          </PrimaryButton>
          <SecondaryButton className={modalActionClassName} onClick={onClose}>
            Close
          </SecondaryButton>
        </>
      ),
    }

  if (view?.phase === 'error') {
    const single = sentTransactionCount(view) <= 1

    return {
      key: 'error',
      locked: false,
      subject,
      content: (
        <TransactionFailure
          view={view}
          title='Transaction Failed'
          message={`${currentStepLabel(view, MIGRATION_TITLE)} could not be completed. ${name} has not migrated.`}
        />
      ),
      footer: (
        <>
          <PrimaryButton className={modalPrimaryActionClassName} onClick={onRetry}>
            {single ? 'Try Again' : 'Retry Remaining Steps'}
          </PrimaryButton>
          <SecondaryButton className={modalActionClassName} onClick={onReset}>
            Back to Editing
          </SecondaryButton>
        </>
      ),
    }
  }

  return null
}
