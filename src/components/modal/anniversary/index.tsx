'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchAccount } from 'ethereum-identity-kit'
import GrailsLogo from 'public/logo.svg'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import ModalShell, { modalActionClassName, modalPrimaryActionClassName } from '@/components/ui/modal/modalShell'
import AccountChip from '@/components/ui/modal/accountChip'
import DetailList from '@/components/ui/modal/detailList'
import Notice from '@/components/ui/modal/notice'
import TxStatus from '@/components/ui/modal/txStatus'
import TxSteps from '@/components/ui/modal/txSteps'
import TxLink from '@/components/ui/modal/txLink'
import StatusOrb from '@/components/ui/modal/statusOrb'
import { ExternalLinkIcon } from '@/components/ui/modal/icons'
import { ANNIVERSARY_NFT_COLLECTION_URL } from '@/constants/anniversaryNFT'
import { activeChain } from '@/constants/web3/chain'
import type { AnniversaryNftClaim } from '@/state/reducers/portfolio/anniversaryNFT'
import { accountQueryKey } from '@/utils/queryKeys'
import TokenArtwork from './TokenArtwork'
import { useAnniversaryClaim } from './useAnniversaryClaim'

export const AnniversaryNftModalView = ({
  claim,
  flow,
}: {
  claim: AnniversaryNftClaim
  flow: ReturnType<typeof useAnniversaryClaim>
}) => {
  const success = flow.step === 'success'
  const dialog = useRef<HTMLDivElement>(null)
  const { data: account, isLoading: accountLoading } = useQuery({
    queryKey: accountQueryKey(claim.address),
    queryFn: () => fetchAccount(claim.address),
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    const previousFocus = document.activeElement
    const container = dialog.current
    container?.focus({ preventScroll: true })

    const keepFocusInside = (event: FocusEvent) => {
      if (event.target instanceof Node && !container?.contains(event.target)) container?.focus({ preventScroll: true })
    }

    document.addEventListener('focusin', keepFocusInside)
    return () => {
      document.removeEventListener('focusin', keepFocusInside)
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus({ preventScroll: true })
    }
  }, [])

  return (
    <div
      ref={dialog}
      tabIndex={-1}
      className='outline-none'
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return

        const controls = Array.from(
          dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], iframe') ?? []
        ).filter((element) => element.getClientRects().length)
        const first = controls[0]
        const last = controls[controls.length - 1]

        if (!first) {
          event.preventDefault()
          return
        }

        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }}
    >
      <ModalShell
        title='Anniversary NFT'
        onClose={() => void flow.close()}
        dismissible={false}
        locked={flow.isBusy || flow.dismissing}
        stageKey={flow.isBusy ? 'progress' : flow.step}
        footerHint={
          flow.isBusy
            ? 'Keep this window open until your transaction confirms.'
            : flow.step === 'review'
              ? 'Dismissing hides this invitation on future visits.'
              : undefined
        }
        footer={
          success ? (
            <PrimaryButton className={modalPrimaryActionClassName} onClick={() => void flow.close()}>
              Done
            </PrimaryButton>
          ) : flow.isBusy ? (
            <PrimaryButton className={modalPrimaryActionClassName} disabled>
              {flow.step === 'pending' ? 'Minting your NFT…' : 'Continue in your wallet…'}
            </PrimaryButton>
          ) : (
            <>
              <PrimaryButton
                className={modalPrimaryActionClassName}
                disabled={flow.dismissing}
                onClick={() => void flow.mint()}
              >
                {flow.hasPendingTransaction
                  ? 'Check transaction'
                  : flow.step === 'error'
                    ? 'Try again'
                    : 'Claim your NFT'}
              </PrimaryButton>
              <SecondaryButton
                className={modalActionClassName}
                disabled={flow.dismissing}
                onClick={() => void flow.close()}
              >
                {flow.dismissing ? 'Saving…' : 'Dismiss'}
              </SecondaryButton>
            </>
          )
        }
      >
        {flow.step === 'review' && (
          <>
            <div className='bg-primary-soft border-primary-line relative flex flex-col items-center gap-4 overflow-hidden rounded-lg border px-5 py-7 text-center'>
              <div className='bg-background border-primary-line shadow-bulk grid h-20 w-20 place-items-center rounded-full border'>
                <Image src={GrailsLogo} alt='' width={44} height={44} />
              </div>
              <div className='flex flex-col gap-2'>
                <p className='text-primary text-sm font-semibold tracking-[0.2em] uppercase'>Made possible by you</p>
                <h3 className='font-sedan-sc text-4xl'>A year of Grails</h3>
                <p className='text-neutral text-lg'>
                  Thank you for being part of Grails. Your wallet is eligible for a special anniversary NFT.
                </p>
              </div>
            </div>
            <DetailList
              rows={[
                {
                  key: 'recipient',
                  label: 'Claiming with',
                  value: (
                    <AccountChip
                      address={claim.address}
                      name={account?.ens?.name}
                      avatar={account?.ens?.avatar}
                      loading={accountLoading}
                    />
                  ),
                },
                { key: 'network', label: 'Network', value: activeChain.name },
                { key: 'price', label: 'Mint price', value: 'Free', sub: 'Network fee applies' },
              ]}
            />
          </>
        )}

        {flow.isBusy && (
          <>
            <TxStatus
              state={flow.step === 'pending' ? 'pending' : flow.step === 'wallet' ? 'wallet' : 'checking'}
              title={
                flow.step === 'pending'
                  ? 'Minting your NFT'
                  : flow.step === 'wallet'
                    ? 'Confirm in your wallet'
                    : 'Preparing your claim'
              }
              message={
                flow.step === 'pending'
                  ? `Waiting for confirmation on ${activeChain.name}.`
                  : flow.step === 'wallet'
                    ? `Approve the claim on ${activeChain.name}. Your wallet may ask you to switch networks first.`
                    : 'Checking your anniversary claim.'
              }
            />
            <TxSteps
              steps={[
                { key: 'wallet', label: 'Confirm in wallet', status: flow.step === 'pending' ? 'done' : 'active' },
                {
                  key: 'mint',
                  label: 'Mint anniversary NFT',
                  status: flow.step === 'pending' ? 'active' : 'upcoming',
                  hash: flow.hash,
                },
              ]}
            />
          </>
        )}

        {flow.step === 'error' && (
          <TxStatus
            state='error'
            title={flow.hasPendingTransaction ? 'Waiting for confirmation' : 'Claim not completed'}
            message={flow.error}
          >
            <TxLink hash={flow.hash} />
          </TxStatus>
        )}

        {success && (
          <>
            <div role='status' className='flex items-center gap-3 py-2'>
              <StatusOrb state='success' className='h-11 w-11' />
              <div className='flex flex-col gap-1'>
                <h3 className='text-2xl font-bold'>Your anniversary NFT</h3>
                <p className='text-neutral text-lg'>Thanks for being part of the journey.</p>
              </div>
            </div>
            <div className='mx-auto w-full max-w-88'>
              <TokenArtwork tokenId={claim.tokenId} />
            </div>
            <div className='flex flex-wrap items-center justify-center gap-3 py-1'>
              <TxLink hash={flow.hash} />
              <a
                href={ANNIVERSARY_NFT_COLLECTION_URL}
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary inline-flex items-center gap-1.5 text-lg hover:underline'
              >
                View on OpenSea <ExternalLinkIcon className='h-4 w-4' />
                <span className='sr-only'> (opens in a new tab)</span>
              </a>
            </div>
          </>
        )}

        {flow.statusError && (
          <div className='flex flex-col gap-2'>
            <Notice tone='warning'>{flow.statusError}</Notice>
            {success && (
              <SecondaryButton disabled={flow.savingStatus} onClick={() => void flow.saveMinted()}>
                {flow.savingStatus ? 'Saving…' : 'Save status again'}
              </SecondaryButton>
            )}
          </div>
        )}
      </ModalShell>
    </div>
  )
}

const AnniversaryNftModal = ({ claim, onClose }: { claim: AnniversaryNftClaim; onClose: () => void }) => {
  const flow = useAnniversaryClaim(claim, onClose)
  return <AnniversaryNftModalView claim={claim} flow={flow} />
}

export default AnniversaryNftModal
