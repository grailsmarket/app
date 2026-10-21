import { useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { normalize } from 'viem/ens'
import { mainnet } from 'viem/chains'
import { useUserContext } from '@/context/user'
import { activeChain } from '@/constants/web3/chain'
import { fetchPrimaryNameOptions } from '@/api/user/primaryNameOptions'
import { useDebounce } from '@/hooks/useDebounce'
import { accountQueryKey } from '@/utils/queryKeys'
import {
  type PrimaryNameOption,
  createPrimaryNameClient,
  preparePrimaryAddress,
  preparePrimaryName,
  primaryNameChain,
  readPrimaryNameReview,
  verifyPrimaryNameOwner,
} from '@/utils/settings/primaryName'
import { useSettingsTransaction, type SettingsTransactionStep } from './useSettingsTransaction'

export const usePrimaryName = () => {
  const { userAddress, authStatus } = useUserContext()
  const queries = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<PrimaryNameOption | null>(null)
  const [addressConsent, setAddressConsent] = useState<string | null>(null)
  const debouncedSearch = useDebounce(search.trim(), 250)
  const clients = useMemo(() => ({ 1: createPrimaryNameClient(1), 2: createPrimaryNameClient(2) }), [])
  const version = selected?.version ?? (activeChain.id === mainnet.id ? 1 : 2)
  const chain = primaryNameChain(version)
  const client = clients[version]
  const authenticated = !!userAddress && authStatus === 'authenticated'
  const transaction = useSettingsTransaction({ client, chain })
  const busy = transaction.busy || transaction.pending

  const primary = useQuery({
    queryKey: ['settings', 'primary-name', chain.id, userAddress],
    queryFn: () => client.getEnsName({ address: userAddress! }),
    enabled: authenticated,
    retry: false,
  })

  const names = useInfiniteQuery({
    queryKey: ['settings', 'primary-name-options', userAddress, debouncedSearch],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      fetchPrimaryNameOptions({ address: userAddress!, search: debouncedSearch, page: pageParam, signal }),
    getNextPageParam: (last) => last.nextPage,
    enabled: authenticated && editing,
    retry: false,
  })

  let exactName: string | null = null

  try {
    if (debouncedSearch.includes('.')) exactName = normalize(debouncedSearch)
  } catch {
    // Incomplete search strings can still match indexed names.
  }

  const exact = useQuery({
    queryKey: ['settings', 'primary-name-exact', userAddress, exactName, activeChain.id],
    queryFn: async () => {
      const results = await Promise.allSettled(
        ([1, 2] as const).map(async (nameVersion) => {
          const option: PrimaryNameOption = { name: exactName!, version: nameVersion, token_id: '', expiry_date: null }

          await verifyPrimaryNameOwner(clients[nameVersion], option, userAddress!)

          return option
        })
      )

      return results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))
    },
    enabled: authenticated && editing && !!exactName,
    retry: false,
  })

  const options = new Map<string, PrimaryNameOption>()

  if (search.trim() === debouncedSearch) {
    for (const option of names.data?.pages.flatMap((page) => page.names) ?? []) {
      if (option.version === 1 || option.version === 2)
        options.set(`${option.version}:${option.name}`, { ...option, version: option.version })
    }

    for (const option of exact.data ?? []) {
      const key = `${option.version}:${option.name}`
      if (!options.has(key)) options.set(key, option)
    }
  }

  const review = useQuery({
    queryKey: ['settings', 'primary-name-review', userAddress, selected?.name, selected?.version],
    queryFn: () => readPrimaryNameReview(client, selected!, userAddress!),
    enabled: authenticated && editing && !!selected && !busy,
    retry: false,
  })
  const previousPhase = useRef(transaction.phase)
  const reviewKey = JSON.stringify([
    userAddress,
    selected?.name,
    selected?.version,
    review.data?.address,
    review.data?.resolver,
    review.data?.configurationId?.toString(),
    review.data?.usesDefault,
  ])
  const updateAddress = addressConsent === reviewKey

  const setUpdateAddress = (value: boolean) => setAddressConsent(value ? reviewKey : null)

  useEffect(() => {
    if (previousPhase.current === 'error' && transaction.phase === 'idle') void review.refetch()
    previousPhase.current = transaction.phase
  }, [transaction.phase, review.refetch])

  const select = (option: PrimaryNameOption) => {
    setSelected(option)
    setAddressConsent(null)
  }

  const cancel = () => {
    if (busy) return

    setEditing(false)
    setSearch('')
    setSelected(null)
    setAddressConsent(null)
  }

  const changed = !!selected && selected.name !== primary.data
  const canSave =
    authenticated &&
    changed &&
    !!review.data &&
    !review.isFetching &&
    !review.isError &&
    !review.data.blocked &&
    (!review.data.needsAddress || updateAddress) &&
    !busy

  const save = () => {
    if (!canSave || !selected || !review.data) return

    const option = selected
    const reviewed = review.data
    const steps: SettingsTransactionStep[] = []
    const assertAccount = (account: string) => {
      if (account.toLowerCase() !== userAddress!.toLowerCase())
        throw new Error('Connect the authenticated wallet before setting its primary name.')
    }

    if (reviewed.needsAddress) {
      steps.push({
        label: 'Update Ethereum address',
        prepare: async (account) => {
          assertAccount(account)

          return preparePrimaryAddress(client, option, account, reviewed)
        },
      })
    }

    steps.push({
      label: 'Set primary name',
      prepare: async (account) => {
        assertAccount(account)

        return preparePrimaryName(client, option, account)
      },
      confirmed: () => {
        setEditing(false)
        setSearch('')
        setAddressConsent(null)
        void queries.invalidateQueries({ queryKey: ['settings', 'primary-name'] })

        if (chain.id === mainnet.id) {
          void queries.invalidateQueries({ queryKey: accountQueryKey(userAddress) })
          void queries.invalidateQueries({ queryKey: ['profile'] })
        }
      },
    })

    void transaction.run(steps)
  }

  return {
    primary,
    names,
    options: [...options.values()],
    searching: search.trim() !== debouncedSearch || names.isFetching || exact.isFetching,
    editing,
    setEditing,
    search,
    setSearch,
    selected,
    select,
    review,
    version,
    chain,
    transaction,
    changed,
    busy,
    canSave,
    updateAddress,
    setUpdateAddress,
    cancel,
    save,
  }
}
