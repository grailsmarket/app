import { useMemo, useRef } from 'react'
import { useAccount } from 'wagmi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { type Address, encodeFunctionData, parseEventLogs } from 'viem'
import { activeChain } from '@/constants/web3/chain'
import { COMMEMORATIVE_NFT_ABI, COMMEMORATIVE_NFT_ADDRESS } from '@/constants/web3/abi/CommemorativeNFT'
import { useSettingsTransaction } from '@/hooks/settings/useSettingsTransaction'
import {
  commemorativeNFTAssets,
  readCommemorativeNFT,
  readCommemorativeNFTClaimed,
} from '@/utils/migration/commemorativeNFT'
import { readMigrationProgress } from '@/utils/migration/migrationProgress'
import { createV2RecordsClient } from '@/utils/records/client'
import { useAppDispatch } from '@/state/hooks'
import { setBulkMigrationModalNames, setBulkMigrationModalOpen } from '@/state/reducers/modals/bulkMigrationModal'

export const useMigrationReward = (owner: Address) => {
  const { address } = useAccount()
  const client = useMemo(createV2RecordsClient, [])
  const queries = useQueryClient()
  const dispatch = useAppDispatch()
  const transaction = useSettingsTransaction()
  const claiming = useRef(false)
  const enabled = activeChain.id === 1 && address?.toLowerCase() === owner.toLowerCase()
  const key = ['profile', 'migrationReward', owner.toLowerCase(), activeChain.id]
  const claimedKey = ['commemorativeNFT', activeChain.id, COMMEMORATIVE_NFT_ADDRESS, owner.toLowerCase()]
  const assets = commemorativeNFTAssets(owner)

  const claimed = useQuery({
    queryKey: claimedKey,
    queryFn: async ({ signal }) => {
      const result = await readCommemorativeNFTClaimed(client, owner)
      signal.throwIfAborted()
      return result
    },
    enabled,
    staleTime: (query) => (query.state.data === true ? Infinity : 0),
    retry: false,
  })

  const nft = useQuery({
    queryKey: [...key, 'nft'],
    queryFn: ({ signal }) => readCommemorativeNFT(client, owner, signal),
    enabled: enabled && claimed.data !== true,
    staleTime: 30_000,
    retry: false,
  })
  const progress = useQuery({
    queryKey: [...key, 'progress'],
    queryFn: ({ signal }) => readMigrationProgress(client, owner, signal),
    enabled: enabled && !!nft.data?.eligible && claimed.isSuccess && !claimed.data,
    staleTime: 30_000,
    retry: false,
  })
  const canAct =
    enabled &&
    claimed.isSuccess &&
    !claimed.data &&
    !claimed.isFetching &&
    nft.isSuccess &&
    nft.data.eligible &&
    !nft.isFetching &&
    progress.isSuccess &&
    !progress.isFetching &&
    !transaction.busy &&
    !transaction.pending
  const canClaim = canAct && progress.data.remaining === 0 && progress.data.migrated > 0
  const canMigrate = canAct && progress.data.remainingNames.length > 0

  const migrate = () => {
    if (!canMigrate) return
    dispatch(setBulkMigrationModalNames(progress.data.remainingNames))
    dispatch(setBulkMigrationModalOpen(true))
  }

  const rememberClaimed = async () => {
    await queries.cancelQueries({ queryKey: claimedKey, exact: true })
    queries.setQueryData(claimedKey, true)
  }

  const claim = async () => {
    if (!canClaim || claiming.current) return
    claiming.current = true
    try {
      await transaction.run(
        [
          {
            label: 'Claim Commemorative NFT',
            pendingLabel: 'Claiming your NFT',
            readTimeoutMs: 120_000,
            prepare: async (account) => {
              if (account.toLowerCase() !== owner.toLowerCase())
                throw new Error('Connect the wallet that owns this profile to claim its commemorative NFT.')
              if (await readCommemorativeNFTClaimed(client, owner)) {
                await rememberClaimed()
                return null
              }
              const current = await readCommemorativeNFT(client, owner)
              queries.setQueryData([...key, 'nft'], current)
              if (!current.eligible) throw new Error('This wallet is not eligible for the ENS commemorative NFT.')

              const completion = await readMigrationProgress(client, owner)
              queries.setQueryData([...key, 'progress'], completion)
              if (completion.remaining || !completion.migrated)
                throw new Error('Migrate all your eligible names before claiming your commemorative NFT.')

              return {
                to: COMMEMORATIVE_NFT_ADDRESS,
                data: encodeFunctionData({ abi: COMMEMORATIVE_NFT_ABI, functionName: 'claim', args: [current.proof] }),
              }
            },
            verifyReceipt: (receipt) => {
              const minted = parseEventLogs({
                abi: COMMEMORATIVE_NFT_ABI,
                eventName: 'Claimed',
                logs: receipt.logs.filter(
                  (log) => log.address.toLowerCase() === COMMEMORATIVE_NFT_ADDRESS.toLowerCase()
                ),
              }).some(
                (log) => log.args.eoa.toLowerCase() === owner.toLowerCase() && log.args.tokenId === assets.tokenId
              )
              if (!minted)
                throw new Error('This transaction did not claim your NFT. It may have been cancelled or replaced.')
            },
            confirmed: () => void rememberClaimed(),
          },
        ],
        {
          title: 'Claim Commemorative NFT',
          successTitle: 'NFT claimed',
          successMessage: 'Your ENS commemorative NFT has been claimed.',
          errorTitle: 'Unable to claim NFT',
        }
      )
    } finally {
      claiming.current = false
    }
  }

  const retry = () => {
    void queries.invalidateQueries({ queryKey: key })
    if (!claimed.data) void queries.invalidateQueries({ queryKey: claimedKey, exact: true })
  }

  return { nft, claimed, assets, progress, transaction, canClaim, canMigrate, claim, migrate, retry }
}
