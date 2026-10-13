'use client'

import { useQuery } from '@tanstack/react-query'
import { useAccount, usePublicClient } from 'wagmi'
import { activeChain } from '@/constants/web3/chain'
import { useEnsV2Status } from '@/hooks/useEnsV2'
import { getEthLabel, getV2Name } from '@/utils/web3/ensv2'
import { ensApi } from '@/api/ens-v2'
import { Notice, buttonClass } from '@/components/ens-v2/ui'
import V1EditRecordsModal from './v1EditRecordsModal'
import V2EditRecordsModal, { RecordsModalFrame } from './v2EditRecordsModal'

export interface EditRecordsModalProps {
  name: string
  metadata: Record<string, string> | null
  defaultTab: 'records' | 'roles'
  onClose: () => void
}

export default function EditRecordsModal(props: EditRecordsModalProps) {
  const network = useEnsV2Status()
  const client = usePublicClient({ chainId: activeChain.id })
  const { address } = useAccount()
  const version = useQuery({
    queryKey: ['name', 'ens-version', activeChain.id, address, props.name, network.data?.ethRegistry],
    enabled: !!client && network.isSuccess,
    queryFn: async () => {
      if (!network.data) return 'v1'
      if (getEthLabel(props.name)) return (await getV2Name(client!, network.data, props.name)) ? 'v2' : 'v1'
      return (await ensApi.name(activeChain.id, props.name)).version
    },
    retry: false,
  })
  if (network.error || version.error)
    return (
      <RecordsModalFrame name={props.name} onClose={props.onClose}>
        <Notice error>{network.error?.message || version.error?.message}</Notice>
        <button
          className={buttonClass}
          onClick={() => {
            network.refetch()
            version.refetch()
          }}
        >
          Retry name detection
        </button>
      </RecordsModalFrame>
    )
  if (version.isPending)
    return (
      <RecordsModalFrame name={props.name} onClose={props.onClose}>
        <Notice>Checking name version…</Notice>
      </RecordsModalFrame>
    )
  return version.data === 'v2' ? (
    <V2EditRecordsModal key={`${address}:${props.name}`} {...props} />
  ) : (
    <V1EditRecordsModal {...props} />
  )
}
