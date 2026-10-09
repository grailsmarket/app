import { type Address, type Hex, zeroAddress } from 'viem'
import { usePublicClient } from 'wagmi'
import { activeChain } from '@/constants/web3/chain'
import { useGetWalletClient } from '@/hooks/useGetWalletClient'
import { ENS_V2_REGISTRAR_ABI } from '@/constants/abi/ENSv2'
import { ENS_HOLIDAY_REFERRER_ADDRESS } from '@/constants/web3/contracts'
import { ensureChain } from '@/utils/web3/ensureChain'
import { type EnsV2Contracts, ensureAllowance, getOwnedResolver } from '@/utils/web3/ensv2'

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

  const makeCommitment = async (v2: EnsV2Contracts, label: string, owner: Address, secret: Hex, duration: bigint) =>
    client().readContract({
      address: v2.ethRegistrar,
      abi: ENS_V2_REGISTRAR_ABI,
      functionName: 'makeCommitment',
      args: [
        label,
        owner,
        secret,
        zeroAddress,
        (await getOwnedResolver(client(), v2, owner)).address,
        duration,
        ENS_HOLIDAY_REFERRER_ADDRESS,
      ],
    })

  const commit = async (v2: EnsV2Contracts, commitment: Hex) => {
    const walletClient = await getWalletClient()
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
    label: string,
    owner: Address,
    secret: Hex,
    duration: bigint,
    token: Address
  ) => {
    const walletClient = await getWalletClient()
    await ensureChain(walletClient, activeChain.id)
    await ensureAllowance(client(), walletClient, token, v2.ethRegistrar, await getPrice(v2, label, duration, token))
    const resolver = (await getOwnedResolver(client(), v2, owner)).address
    return walletClient.writeContract({
      address: v2.ethRegistrar,
      abi: ENS_V2_REGISTRAR_ABI,
      functionName: 'register',
      args: [label, owner, secret, zeroAddress, resolver, duration, token, ENS_HOLIDAY_REFERRER_ADDRESS],
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
    ]).catch(() => [60, 86_400])
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
