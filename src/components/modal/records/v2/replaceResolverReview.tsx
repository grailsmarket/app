'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import type { Address } from 'viem'
import { activeChain } from '@/constants/web3/chain'
import { SettingsTransactionProvider } from '@/context/settingsTransaction'
import { useSettingsTransaction } from '@/hooks/settings/useSettingsTransaction'
import { createV2RecordsClient } from '@/utils/records/client'
import { findReplacementTarget, replacementSteps, type ResolverReplacement } from '@/utils/records/replaceResolver'
import { settingsTransactionScreen } from '@/components/settings/transactionModal'
import ModalShell, { modalActionClassName, modalPrimaryActionClassName } from '@/components/ui/modal/modalShell'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'

interface Props {
  review: ResolverReplacement
  preferred?: Address
  onCancel: () => void
  onSaved: () => void
  onFinish: () => void
}

const Review = ({ review, preferred, onCancel, onSaved, onFinish }: Props) => {
  const { address } = useAccount()
  const client = useMemo(createV2RecordsClient, [])
  const transaction = useSettingsTransaction()
  const sameWallet = address?.toLowerCase() === review.account.toLowerCase()
  const target = useQuery({
    queryKey: [
      'resolver-replacement',
      activeChain.id,
      review.account,
      review.name,
      review.binding.resolver,
      preferred,
      review.records.map(({ kind, key, value }) => [kind, key, value]),
    ],
    queryFn: () => findReplacementTarget(client, review, preferred),
    enabled: sameWallet,
    gcTime: 0,
    staleTime: Infinity,
    retry: false,
  })
  const close = () => {
    if (transaction.phase === 'confirming' || transaction.phase === 'processing' || transaction.submitted) return
    transaction.reset()
    if (transaction.phase === 'success') onFinish()
    else onCancel()
  }
  const title = 'Save records and switch resolver'
  const screen =
    transaction.phase === 'idle'
      ? null
      : settingsTransactionScreen({
          ...transaction,
          phase: transaction.phase,
          title,
          networkName: activeChain.name,
          successTitle: 'Records saved',
          successMessage: `${review.name} now uses its new configuration.`,
          onRetry: () => void transaction.run(),
          onClose: close,
        })
  const save = () => {
    if (!target.data || !sameWallet) return
    void transaction.run(replacementSteps(client, review, target.data, onSaved))
  }
  return (
    <ModalShell
      title={title}
      onClose={close}
      locked={transaction.busy || transaction.submitted}
      stageKey={screen?.key ?? 'review'}
      footerHint={screen?.footerHint}
      footer={
        screen?.footer ?? (
          <>
            <PrimaryButton
              className={modalPrimaryActionClassName}
              onClick={save}
              disabled={!target.data || !sameWallet}
            >
              Save and switch resolver
            </PrimaryButton>
            <SecondaryButton className={modalActionClassName} onClick={onCancel}>
              Back to editing
            </SecondaryButton>
          </>
        )
      }
    >
      {screen ? (
        screen.content
      ) : (
        <div className='flex flex-col gap-3'>
          <p>
            Saving will change the resolver for <b>{review.name}</b>. Grails will create a new configuration with your
            edits and all the existing records you kept, then switch the name in a second transaction.
          </p>
          {!sameWallet ? (
            <p role='alert'>Reconnect the wallet that started this edit.</p>
          ) : target.data ? (
            <div className='bg-secondary border-tertiary rounded-md border p-3'>
              <p>
                {target.data.deploy ? 'A new resolver will be deployed for your wallet.' : 'Your destination resolver'}
              </p>
              <p className='text-neutral break-all'>{target.data.address}</p>
            </div>
          ) : target.isError ? (
            <div role='alert'>
              <p>{target.error.message}</p>
              <SecondaryButton onClick={() => target.refetch()}>Retry resolver lookup</SecondaryButton>
            </div>
          ) : (
            <p role='status'>Checking which resolver your wallet can use…</p>
          )}
          <p className='text-neutral'>Choose Back to editing to keep your draft and cancel the switch.</p>
        </div>
      )}
    </ModalShell>
  )
}

const ReplaceResolverReview = (props: Props) => (
  <SettingsTransactionProvider inline>
    <Review {...props} />
  </SettingsTransactionProvider>
)
export default ReplaceResolverReview
