'use client'

import { useState } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { ENS_REGISTRAR_ADDRESS, ENS_NAME_WRAPPER_ADDRESS } from '@/constants/web3/contracts'
import SecondaryButton from '@/components/ui/buttons/secondary'
import PrimaryButton from '@/components/ui/buttons/primary'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { setTransferModalDomains, TransferDomainType } from '@/state/reducers/modals/transferModal'
import { clearBulkSelect, selectBulkSelect } from '@/state/reducers/modals/bulkSelectModal'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { formatAddress } from '@/utils/formatAddress'
import { isAddress, Address } from 'viem'
import Input from '@/components/ui/input'
import { mainnet } from 'viem/chains'
import { beautifyName } from '@/lib/ens'
import { checkIfWrapped } from '@/api/domains/checkIfWrapped'
import { NAME_WRAPPER_ABI } from '@/constants/abi/NameWrapper'
import { Avatar, Check, fetchAccount } from 'ethereum-identity-kit'
import { useDebounce } from '@/hooks/useDebounce'
import { BaseRegistrarAbi } from '@/constants/abi/BaseRegistrar'

interface TransferModalProps {
  domains: TransferDomainType[]
  onClose: () => void
}

type TransactionStep = 'review' | 'confirming' | 'processing' | 'success' | 'error'

const TransferModal: React.FC<TransferModalProps> = ({ domains, onClose }) => {
  const dispatch = useAppDispatch()
  const [step, setStep] = useState<TransactionStep>('review')
  const [txHashes, setTxHashes] = useState<{ name: string; hash: string }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [recipientInput, setRecipientInput] = useState('')
  const debouncedRecipientInput = useDebounce(recipientInput, 200)

  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const queryClient = useQueryClient()
  const { isSelecting } = useAppSelector(selectBulkSelect)

  const handleClose = () => {
    // Clear bulk selection only on success
    if (step === 'success') {
      if (isSelecting) {
        dispatch(clearBulkSelect())
      }
    }

    // Always clear modal data when closing to prevent stale data
    dispatch(setTransferModalDomains([]))

    onClose()
  }

  const { data: account, isLoading: isResolving } = useQuery({
    queryKey: ['account', debouncedRecipientInput],
    queryFn: async () => {
      if (!isAddress(recipientInput) && !recipientInput.includes('.')) return null
      const response = await fetchAccount(recipientInput)

      if (!isAddress(response?.address ?? '')) return null
      // if (!response?.address) {
      //   if (!recipientInput.includes('.')) {
      //     const resolvedAddress = await publicClient?.getEnsAddress({ name: recipientInput })
      //     return { address: resolvedAddress, ens: { name: recipientInput, avatar: null } }
      //   }

      //   return { address: recipientInput, ens: { name: null, avatar: null } }
      // }

      return response
    },
    enabled: !!debouncedRecipientInput,
  })

  const handleTransfer = async () => {
    if (!walletClient || !address || !account || !publicClient) return

    setStep('confirming')

    try {
      const transfers = domains.map(async (domain) => {
        const tokenId = BigInt(domain.tokenId)
        const isWrapped = await checkIfWrapped(domain.name)
        const contractAddress = isWrapped ? ENS_NAME_WRAPPER_ADDRESS : ENS_REGISTRAR_ADDRESS
        const abi = isWrapped ? NAME_WRAPPER_ABI : BaseRegistrarAbi
        const functionName = 'safeTransferFrom'
        const recipientAddress = account.address
        const args = isWrapped
          ? [address, recipientAddress, tokenId, BigInt(1), '0x']
          : [address, recipientAddress, tokenId]

        // Simulate the transaction first
        await publicClient.simulateContract({
          address: contractAddress as Address,
          abi,
          functionName,
          // @ts-expect-error - ABI types are compatible
          args,
          account: address,
        })

        await walletClient.switchChain({ id: mainnet.id })
        // Send the transaction
        return walletClient.writeContract({
          address: contractAddress as Address,
          abi,
          functionName,
          // @ts-expect-error - ABI types are compatible
          args,
          chain: mainnet,
        })
      })

      const hashes = await Promise.all(transfers)
      setTxHashes(hashes.map((hash, index) => ({ name: domains[index].name, hash }))) // Store the first transaction hash
      setStep('processing')

      const erroredNames = []
      // Wait for all transactions
      await Promise.all(
        hashes.map(async (hash, index) => {
          const receipt = await publicClient.waitForTransactionReceipt({
            hash,
          })

          console.log('receipt', receipt)

          if (receipt.status !== 'success') {
            erroredNames.push(domains[index].name ?? 'one of the names')
          }

          return receipt
        })
      )

      setStep('success')
      setTimeout(() => {
        domains.forEach((domain) => {
          queryClient.refetchQueries({ queryKey: ['name', 'details', domain.name] })
        })
        queryClient.invalidateQueries({ queryKey: ['profile', 'domains'] })
      }, 2000)
    } catch (error) {
      console.error('Transfer error:', error)
      setError((error as Error).message)
      setStep('error')
    }
  }

  const formatDomainsText = () => {
    if (domains.length === 1) {
      return beautifyName(domains[0].name)
    } else if (domains.length === 2) {
      return `${beautifyName(domains[0].name)} and ${beautifyName(domains[1].name)}`
    } else {
      const displayNames = domains
        .slice(0, 3)
        .map((d) => beautifyName(d.name))
        .join(', ')
      const remaining = domains.length - 3
      return remaining > 0 ? `${displayNames}, and ${remaining} more` : displayNames
    }
  }

  const renderContent = () => {
    switch (step) {
      case 'review':
        return (
          <>
            <div className='space-y-2'>
              <h3 className='px-lg text-lg font-semibold'>
                {domains.length > 1 ? `Names to Transfer (${domains.length})` : 'Name to Transfer'}
              </h3>
              <div className='bg-secondary max-h-48 overflow-y-auto rounded-md p-4'>
                {domains.map((domain) => (
                  <div key={domain.tokenId} className='py-1 font-bold'>
                    {beautifyName(domain.name)}
                  </div>
                ))}
              </div>
            </div>
            <div className='space-y-2'>
              <Input
                label='Recipient'
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                placeholder='Address or ENS name'
              />
              {account?.address && !isResolving && (
                <div key={account.address} className='flex items-center gap-2'>
                  {account.ens.avatar && (
                    <Avatar
                      address={account.address}
                      src={account.ens.avatar}
                      name={account.ens.name}
                      style={{ width: '24px', height: '24px' }}
                    />
                  )}
                  <p className='text-md text-neutral max-w-full truncate pt-0.5 font-medium'>
                    {isAddress(recipientInput) ? account.ens.name : account.address}
                  </p>
                </div>
              )}
              {error && !isResolving && <p className='text-sm text-red-500'>{error}</p>}
            </div>
            <div className='flex flex-col gap-2'>
              <PrimaryButton
                onClick={handleTransfer}
                disabled={!account?.address || isResolving || !!error}
                className='w-full'
              >
                Transfer
              </PrimaryButton>
              <SecondaryButton onClick={handleClose} className='w-full'>
                Cancel
              </SecondaryButton>
            </div>
          </>
        )

      case 'confirming':
      case 'processing':
        return (
          <>
            <p className='text-center font-bold'>
              {step === 'confirming' ? 'Confirm Transfer' : 'Processing Transfer'}
            </p>
            <div className='flex flex-col items-center gap-4'>
              <div className='border-primary my-2 inline-block h-12 w-12 animate-spin rounded-full border-b-2'></div>
              <p className='text-lg'>
                {step === 'confirming'
                  ? 'Please confirm the transaction in your wallet...'
                  : `Transferring ${domains.length} name${domains.length > 1 ? 's' : ''}...`}
              </p>
              {txHashes.length > 0 && (
                <div className='bg-secondary flex max-h-48 w-full flex-col gap-2 overflow-y-auto rounded-md p-4'>
                  {txHashes.map(({ name, hash }) => (
                    <div key={hash} className='flex w-full flex-row items-center justify-between'>
                      <p className='font-bold'>{name}</p>
                      <a
                        href={`https://${mainnet.id === 1 ? '' : 'sepolia.'}etherscan.io/tx/${hash}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-primary hover:underline'
                      >
                        View on Etherscan
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <SecondaryButton onClick={handleClose} disabled={true} className='w-full'>
              Close
            </SecondaryButton>
          </>
        )

      case 'success':
        return (
          <>
            <div className='flex flex-col items-center gap-4'>
              <div className='bg-primary mx-auto flex w-fit items-center justify-center rounded-full p-2'>
                <Check className='text-background h-6 w-6' />
              </div>
              <p className='text-center text-lg font-medium'>
                Transfer of {formatDomainsText()} to {account?.ens.name || formatAddress(account?.address ?? '')} was
                successful!
              </p>
              {txHashes.length > 0 && (
                <div className='bg-secondary flex max-h-48 w-full flex-col gap-2 overflow-y-auto rounded-md p-4'>
                  {txHashes.map(({ name, hash }) => (
                    <div key={hash} className='flex w-full flex-row items-center justify-between'>
                      <p className='font-bold'>{name}</p>
                      <a
                        href={`https://${mainnet.id === 1 ? '' : 'sepolia.'}etherscan.io/tx/${hash}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-primary hover:underline'
                      >
                        View on Etherscan
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <SecondaryButton onClick={handleClose} className='w-full'>
              Close
            </SecondaryButton>
          </>
        )

      case 'error':
        return (
          <>
            <div className='flex flex-col gap-2 rounded-lg border border-red-500/20 bg-red-900/20 p-4'>
              <h2 className='text-2xl font-bold text-red-400'>Transaction Failed</h2>
              <p className='line-clamp-6 text-red-400'>{error || 'An unknown error occurred'}</p>
            </div>
            <div className='flex w-full flex-col gap-2'>
              <PrimaryButton
                onClick={() => {
                  setStep('review')
                  setError(null)
                  setTxHashes([])
                }}
                className='w-full'
              >
                Try Again
              </PrimaryButton>
              <SecondaryButton onClick={handleClose} className='w-full'>
                Close
              </SecondaryButton>
            </div>
          </>
        )
    }
  }

  return (
    <div
      onClick={() => {
        if (step === 'review' || step === 'error') {
          handleClose()
        }
      }}
      className='fixed inset-0 z-50 flex h-[100dvh] w-screen items-end justify-end bg-black/50 backdrop-blur-sm transition-all duration-250 md:items-center md:justify-center md:p-4 starting:translate-y-[100vh] md:starting:translate-y-0'
    >
      <div
        onClick={(e) => {
          e.stopPropagation()
        }}
        className='border-tertiary bg-background relative flex max-h-[calc(100dvh-80px)] w-full flex-col gap-4 overflow-y-auto border-t p-4 md:max-w-md md:rounded-md md:border-2 md:p-6'
      >
        <h2 className='font-sedan-sc min-h-6 text-center text-3xl'>Transfer Name{domains.length > 1 ? 's' : ''}</h2>
        {renderContent()}
      </div>
    </div>
  )
}

export default TransferModal
