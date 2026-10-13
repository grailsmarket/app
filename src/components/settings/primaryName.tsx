'use client'

import { useState } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAddressEqual, namehash, parseAbi, zeroAddress, type Hex } from 'viem'
import { useGetWalletClient } from '@/hooks/useGetWalletClient'
import { activeChain, EXPLORER_URL } from '@/constants/web3/chain'
import { ENS_REGISTRY_CONTRACT_ADDRESS } from '@/constants/web3/contracts'
import { normalizeName } from '@/lib/ens'
import { ensureChain } from '@/utils/web3/ensureChain'
import { waitForTransaction } from '@/utils/web3/safeTransaction'
import { Field, inputClass, buttonClass, Notice } from '@/components/ens-v2/ui'

const registryAbi = parseAbi(['function owner(bytes32 node) view returns (address)'])
const reverseAbi = parseAbi(['function setName(string name) returns (bytes32)'])

export default function PrimaryName() {
  const { address } = useAccount()
  const client = usePublicClient({ chainId: activeChain.id })
  const getWallet = useGetWalletClient()
  const cache = useQueryClient()
  const [name, setName] = useState('')
  const [review, setReview] = useState(false)
  const [hash, setHash] = useState<Hex | null>(null)
  const current = useQuery({
    queryKey: ['primary-name', activeChain.id, address],
    enabled: !!client && !!address,
    queryFn: () => client!.getEnsName({ address: address! }),
  })
  const save = useMutation({
    mutationFn: async () => {
      if (!client || !address) throw new Error('Connect your wallet.')
      const normalized = normalizeName(name)
      const forward = await client.getEnsAddress({ name: normalized })
      if (!forward || !isAddressEqual(forward, address))
        throw new Error('Set this name’s Ethereum address record to your wallet before making it your primary name.')
      const registrar = await client.readContract({
        address: ENS_REGISTRY_CONTRACT_ADDRESS,
        abi: registryAbi,
        functionName: 'owner',
        args: [namehash('addr.reverse')],
      })
      if (registrar === zeroAddress || !(await client.getBytecode({ address: registrar })))
        throw new Error('The Ethereum reverse registrar is unavailable on this network.')
      const wallet = await getWallet()
      if (!isAddressEqual(wallet.account.address, address))
        throw new Error('The connected wallet changed. Review your primary name again.')
      await ensureChain(wallet, activeChain.id)
      await client.simulateContract({
        address: registrar,
        abi: reverseAbi,
        functionName: 'setName',
        args: [normalized],
        account: wallet.account,
      })
      const tx = await wallet.writeContract({
        address: registrar,
        abi: reverseAbi,
        functionName: 'setName',
        args: [normalized],
        chain: activeChain,
      })
      setHash(tx)
      const receipt = await waitForTransaction(client, tx)
      if (receipt.status !== 'success') throw new Error('The primary-name transaction reverted.')
      return normalized
    },
    onSuccess: () => {
      cache.invalidateQueries({ queryKey: ['primary-name'] })
      cache.invalidateQueries({ queryKey: ['profile'] })
      setReview(false)
    },
  })
  return (
    <section className='border-tertiary mt-4 flex flex-col gap-3 border-t pt-5'>
      <h3 className='text-lg font-medium'>Primary ENS name</h3>
      <p className='text-neutral text-sm'>
        Your onchain Ethereum primary name on {activeChain.name}. Current:{' '}
        {current.isPending ? 'Loading…' : current.data || 'Not set'}. This name must resolve to your connected wallet.
      </p>
      {current.error && <Notice error>Could not read your current primary name.</Notice>}
      <Field label='ENS name'>
        <input
          className={inputClass}
          value={name}
          placeholder='you.eth'
          disabled={save.isPending}
          onChange={(event) => {
            setName(event.target.value)
            setReview(false)
            save.reset()
          }}
        />
      </Field>
      {review && (
        <Notice>
          Set {name} as the onchain Ethereum primary name of {address}.
        </Notice>
      )}
      <button
        className={`${buttonClass} self-start`}
        disabled={!name || save.isPending || save.isSuccess}
        onClick={() => (review ? save.mutate() : setReview(true))}
      >
        {save.isPending ? 'Confirming…' : review ? 'Confirm primary name' : 'Review primary name'}
      </button>
      {hash && (
        <a
          className='text-primary text-sm underline'
          target='_blank'
          rel='noreferrer'
          href={`${EXPLORER_URL}/tx/${hash}`}
        >
          View transaction
        </a>
      )}
      {save.error && <Notice error>{save.error.message}</Notice>}
      {save.isSuccess && <Notice>Primary name confirmed onchain.</Notice>}
    </section>
  )
}
