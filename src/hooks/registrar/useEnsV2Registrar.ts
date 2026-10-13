import { type Address, type Hex } from 'viem'
import { usePublicClient } from 'wagmi'
import { activeChain } from '@/constants/web3/chain'
import { useGetWalletClient } from '@/hooks/useGetWalletClient'
import { ENS_V2_REGISTRAR_ABI } from '@/constants/abi/ENSv2'
import { ensureChain } from '@/utils/web3/ensureChain'
import { type EnsV2Contracts, ensureAllowance } from '@/utils/web3/ensv2'

import type { V2RegistrationSnapshot } from '@/types/registration'
import { assertRegistrationSnapshot, commitmentArguments } from '@/utils/web3/registration-snapshot'

const useEnsV2Registrar = () => {
  const getWalletClient = useGetWalletClient()
  const publicClient = usePublicClient({ chainId: activeChain.id })

  const client = () => {
    if (!publicClient) throw new Error('Public client not available')
    return publicClient
  }

  const checkAvailable = (v2: EnsV2Contracts, labels: string[]) =>
    Promise.all(
      labels.map((label) =>
        client().readContract({
          address: v2.ethRegistrar,
          abi: ENS_V2_REGISTRAR_ABI,
          functionName: 'isAvailable',
          args: [label],
        })
      )
    )

  const getPrice = async (v2: EnsV2Contracts, label: string, duration: bigint, token: Address) => {
    const [base, premium] = await client().readContract({
      address: v2.ethRegistrar,
      abi: ENS_V2_REGISTRAR_ABI,
      functionName: 'getRegisterPrice',
      args: [label, duration, token],
    })
    return base + premium
  }

  const makeCommitment = (snapshot: V2RegistrationSnapshot, index: number, secret: Hex) =>
    client().readContract({
      address: snapshot.registrar,
      abi: ENS_V2_REGISTRAR_ABI,
      functionName: 'makeCommitment',
      args: commitmentArguments(snapshot, index, secret),
    })

  const commit = async (v2: EnsV2Contracts, commitment: Hex, snapshot: V2RegistrationSnapshot) => {
    const walletClient = await getWalletClient()
    assertRegistrationSnapshot(snapshot, activeChain.id, walletClient.account.address, v2.ethRegistrar)
    await ensureChain(walletClient, activeChain.id)
    return walletClient.writeContract({
      address: v2.ethRegistrar,
      abi: ENS_V2_REGISTRAR_ABI,
      functionName: 'commit',
      args: [commitment],
      chain: activeChain,
    })
  }

  const register = async (
    v2: EnsV2Contracts,
    snapshot: V2RegistrationSnapshot,
    index: number,
    secret: Hex,
    token: Address
  ) => {
    const walletClient = await getWalletClient()
    assertRegistrationSnapshot(snapshot, activeChain.id, walletClient.account.address, v2.ethRegistrar)
    await ensureChain(walletClient, activeChain.id)
    const [label, owner, savedSecret, subregistry, resolver, duration, referrer] = commitmentArguments(
      snapshot,
      index,
      secret
    )
    await ensureAllowance(client(), walletClient, token, snapshot.registrar, await getPrice(v2, label, duration, token))
    const args = [label, owner, savedSecret, subregistry, resolver, duration, token, referrer] as const
    await client().simulateContract({
      address: snapshot.registrar,
      abi: ENS_V2_REGISTRAR_ABI,
      functionName: 'register',
      args,
      account: walletClient.account,
    })
    return walletClient.writeContract({
      address: snapshot.registrar,
      abi: ENS_V2_REGISTRAR_ABI,
      functionName: 'register',
      args,
      chain: activeChain,
    })
  }

  const getCommitmentAges = async (v2: EnsV2Contracts) => {
    const [min, max] = await Promise.all([
      client().readContract({
        address: v2.ethRegistrar,
        abi: ENS_V2_REGISTRAR_ABI,
        functionName: 'MIN_COMMITMENT_AGE',
      }),
      client().readContract({
        address: v2.ethRegistrar,
        abi: ENS_V2_REGISTRAR_ABI,
        functionName: 'MAX_COMMITMENT_AGE',
      }),
    ])
    return { min: Number(min), max: Number(max) }
  }

  const checkCommitmentAge = (v2: EnsV2Contracts, commitment: Hex) =>
    client()
      .readContract({
        address: v2.ethRegistrar,
        abi: ENS_V2_REGISTRAR_ABI,
        functionName: 'commitmentAt',
        args: [commitment],
      })
      .then(Number, () => null)

  return { checkAvailable, getPrice, makeCommitment, commit, register, getCommitmentAges, checkCommitmentAge }
}

export default useEnsV2Registrar
