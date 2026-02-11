'use client'

import { useState, useEffect } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import {
  ENS_REGISTRAR_ADDRESS,
  ENS_NAME_WRAPPER_ADDRESS,
  BULK_TRANSFER_CONTRACT_ADDRESS,
  OPENSEA_CONDUIT_KEY,
  OPENSEA_CONDUIT_ADDRESS,
} from '@/constants/web3/contracts'
import SecondaryButton from '@/components/ui/buttons/secondary'
import PrimaryButton from '@/components/ui/buttons/primary'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { setTransferModalDomains, TransferDomainType } from '@/state/reducers/modals/transferModal'
import { clearBulkSelect, selectBulkSelect } from '@/state/reducers/modals/bulkSelectModal'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { formatAddress } from '@/utils/formatAddress'
import { isAddress, Address, labelhash, namehash } from 'viem'
import Input from '@/components/ui/input'
import { mainnet } from 'viem/chains'
import { beautifyName, normalizeName } from '@/lib/ens'
import { checkIfWrapped } from '@/api/domains/checkIfWrapped'
import { Avatar, Check, fetchAccount } from 'ethereum-identity-kit'
import { useDebounce } from '@/hooks/useDebounce'
import { BULK_TRANSFER_ABI } from '@/constants/abi/BulkTransfer'
import { ItemType } from '@/types/seaport'
import { BaseRegistrarAbi } from '@/constants/abi/BaseRegistrar'
import { NAME_WRAPPER_ABI } from '@/constants/abi/NameWrapper'

interface TransferModalProps {
  domains: TransferDomainType[]
  onClose: () => void
}

type TransactionStep = 'review' | 'approving' | 'confirming' | 'processing' | 'success' | 'error'

const TransferModal: React.FC<TransferModalProps> = ({ domains, onClose }) => {
  const dispatch = useAppDispatch()
  const [step, setStep] = useState<TransactionStep>('review')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recipientInput, setRecipientInput] = useState('')
  const debouncedRecipientInput = useDebounce(recipientInput, 200)
  const [needsRegistrarApproval, setNeedsRegistrarApproval] = useState(false)
  const [needsWrapperApproval, setNeedsWrapperApproval] = useState(false)
  const [approvingContract, setApprovingContract] = useState<string | null>(null)

  const { address } = useAccount()
  const publicClient = usePublicClient({ chainId: mainnet.id })
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

  // Check if approvals are needed
  const checkApprovals = async () => {
    if (!address || !publicClient || !domains.length) return

    try {
      // Check which contracts we need (wrapped vs unwrapped)
      const wrappedStatuses = await Promise.all(domains.map(async (domain) => checkIfWrapped(domain.name)))

      const hasUnwrapped = wrappedStatuses.some((isWrapped) => !isWrapped)
      const hasWrapped = wrappedStatuses.some((isWrapped) => isWrapped)

      // Check registrar approval (for unwrapped names)
      if (hasUnwrapped) {
        const isApproved = await publicClient.readContract({
          address: ENS_REGISTRAR_ADDRESS as Address,
          abi: BaseRegistrarAbi,
          functionName: 'isApprovedForAll',
          args: [address, OPENSEA_CONDUIT_ADDRESS as Address],
        })
        setNeedsRegistrarApproval(!isApproved)
      } else {
        setNeedsRegistrarApproval(false)
      }

      // Check wrapper approval (for wrapped names)
      if (hasWrapped) {
        const isApproved = await publicClient.readContract({
          address: ENS_NAME_WRAPPER_ADDRESS as Address,
          abi: NAME_WRAPPER_ABI,
          functionName: 'isApprovedForAll',
          args: [address, OPENSEA_CONDUIT_ADDRESS as Address],
        })
        setNeedsWrapperApproval(!isApproved)
      } else {
        setNeedsWrapperApproval(false)
      }
    } catch (err) {
      console.error('Error checking approvals:', err)
    }
  }

  // Check approvals when domains change
  useEffect(() => {
    checkApprovals()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domains, address])

  const handleApprove = async (contractAddress: Address, contractName: string) => {
    if (!walletClient || !address || !publicClient) return

    setStep('approving')
    setApprovingContract(contractName)

    try {
      await walletClient.switchChain({ id: mainnet.id })

      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: contractName === 'ENS Registrar' ? BaseRegistrarAbi : NAME_WRAPPER_ABI,
        functionName: 'setApprovalForAll',
        args: [OPENSEA_CONDUIT_ADDRESS as Address, true],
        chain: mainnet,
      })

      await publicClient.waitForTransactionReceipt({ hash })

      // Re-check approvals after successful approval
      await checkApprovals()
      setStep('review')
      setApprovingContract(null)
    } catch (err) {
      console.error('Approval error:', err)
      setError((err as Error).message)
      setStep('error')
      setApprovingContract(null)
    }
  }

  const handleTransfer = async () => {
    if (!walletClient || !address || !account || !publicClient) return
    if (!domains || domains.length === 0) {
      setError('No domains selected for transfer')
      setStep('error')
      return
    }

    setStep('confirming')

    try {
      const recipientAddress = account.address as Address
      const items = await Promise.all(
        domains.map(async (domain) => {
          const isWrapped = await checkIfWrapped(domain.name)
          const normalizedName = normalizeName(domain.name)
          const tokenId = isWrapped ? namehash(normalizedName) : labelhash(normalizedName.replace('.eth', ''))

          return {
            itemType: isWrapped ? ItemType.ERC1155 : ItemType.ERC721,
            token: isWrapped ? ENS_NAME_WRAPPER_ADDRESS : (ENS_REGISTRAR_ADDRESS as Address),
            identifier: BigInt(tokenId),
            amount: BigInt(1),
          }
        })
      )

      // Validate items array before calling contract
      if (!items || items.length === 0) {
        throw new Error('Failed to prepare items for transfer')
      }

      // Structure matches TransferHelperItemsWithRecipient[]
      const transferItems = [
        {
          items,
          recipient: recipientAddress,
          validateERC721Receiver: true,
        },
      ]

      await walletClient.switchChain({ id: mainnet.id })

      // Simulate first to get detailed error
      try {
        await publicClient.simulateContract({
          address: BULK_TRANSFER_CONTRACT_ADDRESS as Address,
          abi: BULK_TRANSFER_ABI,
          functionName: 'bulkTransfer',
          args: [transferItems, OPENSEA_CONDUIT_KEY],
          account: address,
        })
      } catch (simError: any) {
        throw new Error(simError?.shortMessage || simError?.message || 'Transaction simulation failed')
      }

      const hash = await walletClient.writeContract({
        address: BULK_TRANSFER_CONTRACT_ADDRESS as Address,
        abi: BULK_TRANSFER_ABI,
        functionName: 'bulkTransfer',
        args: [transferItems, OPENSEA_CONDUIT_KEY],
        chain: mainnet,
      })

      setTxHash(hash) // Store the first transaction hash
      setStep('processing')

      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
      })

      if (receipt.status !== 'success') {
        throw new Error('Transaction failed')
      }

      setStep('success')
      setTimeout(() => {
        domains.forEach((domain) => {
          queryClient.refetchQueries({ queryKey: ['name', 'details', domain.name] })
        })
        queryClient.invalidateQueries({ queryKey: ['profile', 'domains'] })
      }, 2000)

      return receipt
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
                  {account.ens?.avatar && (
                    <Avatar
                      address={account.address}
                      src={account.ens?.avatar}
                      name={account.ens?.name}
                      style={{ width: '24px', height: '24px' }}
                    />
                  )}
                  <p className='text-md text-neutral max-w-full truncate pt-0.5 font-medium'>
                    {isAddress(recipientInput) ? account.ens?.name : account.address}
                  </p>
                </div>
              )}
              {error && !isResolving && <p className='text-sm text-red-500'>{error}</p>}
            </div>
            {/* Show approval buttons if needed */}
            {/* {(needsRegistrarApproval || needsWrapperApproval) && (
              <div className='bg-secondary space-y-2 rounded-md p-3'>
                <p className='text-neutral text-sm'>Approval required before transfer:</p>
                {needsRegistrarApproval && (
                  <SecondaryButton
                    onClick={() => handleApprove(ENS_REGISTRAR_ADDRESS as Address, 'ENS Registrar')}
                    className='w-full'
                  >
                    Approve ENS Registrar
                  </SecondaryButton>
                )}
                {needsWrapperApproval && (
                  <SecondaryButton
                    onClick={() => handleApprove(ENS_NAME_WRAPPER_ADDRESS as Address, 'Name Wrapper')}
                    className='w-full'
                  >
                    Approve Name Wrapper
                  </SecondaryButton>
                )}
              </div>
            )} */}
            <div className='flex flex-col gap-2'>
              <PrimaryButton
                onClick={async () => {
                  if (needsRegistrarApproval && needsWrapperApproval) {
                    await handleApprove(ENS_REGISTRAR_ADDRESS as Address, 'ENS Registrar')
                    await handleApprove(ENS_NAME_WRAPPER_ADDRESS as Address, 'Name Wrapper')
                  } else if (needsRegistrarApproval) {
                    await handleApprove(ENS_REGISTRAR_ADDRESS as Address, 'ENS Registrar')
                  } else if (needsWrapperApproval) {
                    await handleApprove(ENS_NAME_WRAPPER_ADDRESS as Address, 'Name Wrapper')
                  }

                  handleTransfer()
                }}
                disabled={!account?.address || isResolving || !!error}
                className='w-full'
              >
                {needsRegistrarApproval || needsWrapperApproval ? 'Approve Transfer' : 'Transfer'}
              </PrimaryButton>
              <SecondaryButton onClick={handleClose} className='w-full'>
                Cancel
              </SecondaryButton>
            </div>
          </>
        )

      case 'approving':
        return (
          <>
            <p className='text-center font-bold'>Approving {approvingContract}</p>
            <div className='flex flex-col items-center gap-4'>
              <div className='border-primary my-2 inline-block h-12 w-12 animate-spin rounded-full border-b-2'></div>
              <p className='text-lg'>Please confirm the approval in your wallet...</p>
            </div>
            <SecondaryButton onClick={handleClose} disabled={true} className='w-full'>
              Close
            </SecondaryButton>
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
              {txHash && (
                <div className='mx-auto flex w-full items-center justify-center'>
                  <a
                    href={`https://${mainnet.id === 1 ? '' : 'sepolia.'}etherscan.io/tx/${txHash}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-primary hover:underline'
                  >
                    View on Etherscan
                  </a>
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
                Transfer of {formatDomainsText()} to {account?.ens?.name || formatAddress(account?.address ?? '')} was
                successful!
              </p>
              {txHash && (
                <div className='flex w-full items-center justify-center'>
                  <a
                    href={`https://${mainnet.id === 1 ? '' : 'sepolia.'}etherscan.io/tx/${txHash}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-primary hover:text-primary/80 underline'
                  >
                    View on Etherscan
                  </a>
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
                  setTxHash(null)
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
