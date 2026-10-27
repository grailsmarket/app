import { useState } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { Address } from 'viem'
import { activeChain } from '@/constants/web3/chain'
import { config } from '@/lib/config'
import { fetchCompromiseIncidents } from '@/api/compromised/incidents'
import { useGetWalletClient } from '@/hooks/useGetWalletClient'
import { ensureChain } from '@/utils/web3/ensureChain'
import { waitForTransaction } from '@/utils/web3/safeTransaction'

// Same signature on the V1 registrar, NameWrapper, and V2 registry.
const APPROVAL_ABI = [
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'operator', type: 'address' },
    ],
    name: 'isApprovedForAll',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

const ENS_CONTRACTS = [
  { address: config.ensRegistrar, label: 'ENS Registrar' },
  { address: config.ensNameWrapper, label: 'ENS Name Wrapper' },
  { address: config.ensV2Registry, label: 'ENS V2 Registry' },
]

export type MaliciousApproval = {
  contract: Address
  contractLabel: string
  operator: Address
  incident: string
}

/**
 * Checks whether the connected wallet still has an ENS approval (setApprovalForAll) granted to an
 * operator that was abused in a known exploit (backend compromise_incidents). Anything it receives
 * — e.g. a stolen name bought back — could be drained again, so buy/offer flows ask the user to
 * revoke first.
 */
const useMaliciousApprovals = () => {
  const account = useAccount()
  const { address } = account
  const publicClient = usePublicClient({ chainId: activeChain.id })
  const getWalletClient = useGetWalletClient()
  const [isRevoking, setIsRevoking] = useState(false)
  const [revokeError, setRevokeError] = useState<string | null>(null)

  const incidentsQuery = useQuery({
    queryKey: ['compromise', 'incidents'],
    queryFn: fetchCompromiseIncidents,
    staleTime: 10 * 60 * 1000,
  })

  const operators = (incidentsQuery.data || []).flatMap((incident) =>
    incident.malicious_operators.map((operator) => ({ operator, incident: incident.title }))
  )

  const approvalsQuery = useQuery({
    queryKey: ['compromise', 'approvals', activeChain.id, address, operators.map((o) => o.operator).join(',')],
    queryFn: async (): Promise<MaliciousApproval[]> => {
      if (!address || !publicClient) return []
      const checks = ENS_CONTRACTS.flatMap((contract) =>
        operators.map(async ({ operator, incident }) => {
          const approved = await publicClient.readContract({
            address: contract.address,
            abi: APPROVAL_ABI,
            functionName: 'isApprovedForAll',
            args: [address, operator],
          })
          return approved ? { contract: contract.address, contractLabel: contract.label, operator, incident } : null
        })
      )
      const results = await Promise.all(checks)
      return results.filter((r): r is MaliciousApproval => r !== null)
    },
    enabled: !!address && !!publicClient && operators.length > 0,
    staleTime: 60 * 1000,
  })
  const approvals = approvalsQuery.data ?? []

  // Fail closed: trading stays blocked until the check has actually succeeded for this wallet.
  // A pending or failed incidents fetch / approval read must never count as "no unsafe approvals".
  const isCheckComplete = !!address && incidentsQuery.isSuccess && (operators.length === 0 || approvalsQuery.isSuccess)
  const checkFailed = !!address && (incidentsQuery.isError || approvalsQuery.isError)

  const retryCheck = () => {
    if (incidentsQuery.isError) incidentsQuery.refetch()
    else approvalsQuery.refetch()
  }

  const revoke = async () => {
    if (!publicClient || approvals.length === 0) return
    setRevokeError(null)
    setIsRevoking(true)
    try {
      const walletClient = await getWalletClient()
      await ensureChain(walletClient, activeChain.id)
      for (const approval of approvals) {
        const tx = await walletClient.writeContract({
          address: approval.contract,
          abi: APPROVAL_ABI,
          functionName: 'setApprovalForAll',
          args: [approval.operator, false],
          chain: activeChain,
        })
        const receipt = await waitForTransaction(publicClient, tx, account)
        if (receipt.status !== 'success') throw new Error(`Revoking approval on ${approval.contractLabel} failed`)
      }
    } catch (err: any) {
      setRevokeError(err?.shortMessage || err?.message || 'Failed to revoke approval')
    } finally {
      setIsRevoking(false)
      approvalsQuery.refetch()
    }
  }

  const hasMaliciousApprovals = approvals.length > 0

  return {
    approvals,
    hasMaliciousApprovals,
    isCheckComplete,
    checkFailed,
    retryCheck,
    // True while buying / offering must stay disabled
    blocksTrading: !isCheckComplete || hasMaliciousApprovals || isRevoking,
    revoke,
    isRevoking,
    revokeError,
  }
}

export default useMaliciousApprovals
