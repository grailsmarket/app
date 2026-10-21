import {
  Address,
  Hex,
  concat,
  createPublicClient,
  encodeAbiParameters,
  encodeFunctionData,
  getCreate2Address,
  http,
  keccak256,
  parseEventLogs,
  stringToHex,
} from 'viem'
import { useAccount } from 'wagmi'
import { useGetWalletClient } from '@/hooks/useGetWalletClient'
import { ALL_ROLES } from '@/constants/ens/resolver'
import { PERMISSIONED_RESOLVER_ABI } from '@/constants/web3/abi/PermissionedResolver'
import { VERIFIABLE_FACTORY_ABI } from '@/constants/web3/abi/VerifiableFactory'
import { activeChain } from '@/constants/web3/chain'
import { config } from '@/lib/config'
import { ensureChain } from '@/utils/web3/ensureChain'
import { waitForTransaction } from '@/utils/web3/safeTransaction'

const publicClient = createPublicClient({ chain: activeChain, transport: http() })

interface PredictProxyAddressProps {
  factoryAddress: Address
  proxyLogic: Address
  deployer: Address
  salt: bigint
}

export const usePermissionedResolver = () => {
  const { address } = useAccount()
  const getWalletClient = useGetWalletClient()

  const predictProxyAddress = ({ factoryAddress, proxyLogic, deployer, salt }: PredictProxyAddressProps) => {
    const outerSalt = keccak256(encodeAbiParameters([{ type: 'address' }, { type: 'uint256' }], [deployer, salt]))

    const initCode = concat([
      '0x3d604d80600a3d3981f3363d3d373d3d3d363d73',
      proxyLogic,
      '0x5af43d82803e903d91602b57fd5bf3',
      outerSalt,
    ])

    return getCreate2Address({
      from: factoryAddress,
      salt: outerSalt,
      bytecodeHash: keccak256(initCode),
    })
  }

  const getResolverData = (version: bigint) => {
    if (!address) throw new Error('No wallet detected. Connect your wallet!')

    const resolverSalt = BigInt(
      keccak256(
        encodeAbiParameters(
          [{ type: 'bytes32' }, { type: 'address' }, { type: 'uint256' }],
          [keccak256(stringToHex('OwnedResolver')), address, version]
        )
      )
    )

    const resolverInitData = encodeFunctionData({
      abi: PERMISSIONED_RESOLVER_ABI,
      functionName: 'initialize',
      args: [[{ account: address, roleBitmap: ALL_ROLES }], []],
    })

    return {
      resolverSalt,
      resolverInitData,
    }
  }

  const isUserResolverDeployed = async (version: number = 0): Promise<Address | false> => {
    const resolverData = getResolverData(BigInt(version))

    const proxyLogic = await publicClient.readContract({
      address: config.ensV2VerifiableFactory,
      abi: VERIFIABLE_FACTORY_ABI,
      functionName: 'proxyLogic',
    })

    if (!(resolverData && proxyLogic && address)) return false

    const proxyAddress = predictProxyAddress({
      deployer: address,
      factoryAddress: config.ensV2VerifiableFactory,
      proxyLogic,
      salt: resolverData.resolverSalt,
    })

    const code = await publicClient.getCode({ address: proxyAddress })
    if (!code || code === '0x') return false

    // just checks if resolver is deployed
    await publicClient.readContract({
      address: config.ensV2VerifiableFactory,
      abi: VERIFIABLE_FACTORY_ABI,
      functionName: 'verifyContract',
      args: [proxyAddress],
    })

    return proxyAddress
  }

  const getDeployedResolver = async (hash: Hex): Promise<Address> => {
    const receipt = await waitForTransaction(publicClient, hash)
    if (receipt.status !== 'success') throw new Error('Resolver deployment failed')

    const [resolverLog] = parseEventLogs({
      abi: VERIFIABLE_FACTORY_ABI,
      eventName: 'ProxyDeployed',
      logs: receipt.logs.filter((log) => log.address.toLowerCase() === config.ensV2VerifiableFactory.toLowerCase()),
    })

    if (!resolverLog) throw new Error('Resolver deployment address was not found')
    return resolverLog.args.proxyAddress
  }

  const deployResolver = async (version: number = 0, onSubmitted?: (hash: Hex) => void): Promise<Address> => {
    const wallet = await getWalletClient()
    if (wallet.account.address.toLowerCase() !== address?.toLowerCase()) throw new Error('Connected wallet changed')

    const resolverData = getResolverData(BigInt(version))
    if (!resolverData) throw new Error('missing salt or initial data')

    await ensureChain(wallet, activeChain.id)

    const resolverTx = await wallet.writeContract({
      address: config.ensV2VerifiableFactory,
      abi: VERIFIABLE_FACTORY_ABI,
      functionName: 'deployProxy',
      args: [config.ensV2PermissionedResolverImpl, resolverData.resolverSalt, resolverData.resolverInitData],
      chain: activeChain,
    })

    onSubmitted?.(resolverTx)
    return getDeployedResolver(resolverTx)
  }

  return {
    predictProxyAddress,
    getResolverData,
    isUserResolverDeployed,
    deployResolver,
    getDeployedResolver,
  }
}
