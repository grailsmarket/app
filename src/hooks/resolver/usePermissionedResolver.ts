import {
  Address,
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
import { useAccount, useWalletClient } from 'wagmi'
import { ALL_ROLES } from '@/constants/ens/resolver'
import { PERMISSIONED_RESOLVER_ABI } from '@/constants/web3/abi/PermissionedResolver'
import { VERIFIABLE_FACTORY_ABI } from '@/constants/web3/abi/VerifiableFactory'
import { activeChain } from '@/constants/web3/chain'
import { config } from '@/lib/config'
import { ensureChain } from '@/utils/web3/ensureChain'

interface PredictProxyAddressProps {
  factoryAddress: Address
  proxyLogic: Address
  deployer: Address
  salt: bigint
}

export const usePermissionedResolver = () => {
  const { address } = useAccount()
  const { data: wallet } = useWalletClient()
  const publicClient = createPublicClient({ chain: activeChain, transport: http() })

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

  const isUserResolverDeployed = async (version: number = 0) => {
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

    if (!proxyAddress) return false

    const resolverAddress = await publicClient.readContract({
      address: config.ensV2VerifiableFactory,
      abi: VERIFIABLE_FACTORY_ABI,
      functionName: 'verifyContract',
      args: [proxyAddress],
    })

    return resolverAddress
  }

  const deployResolver = async (version: number = 0) => {
    if (!wallet) throw new Error('No wallet connected!')

    const resolverData = getResolverData(BigInt(version))
    if (!resolverData) throw new Error('missing salt or initial data')

    ensureChain(wallet, activeChain.id)

    const resolverTx = await wallet.writeContract({
      address: config.ensV2VerifiableFactory,
      abi: VERIFIABLE_FACTORY_ABI,
      functionName: 'deployProxy',
      args: [config.ensV2PermissionedResolverImpl, resolverData.resolverSalt, resolverData.resolverInitData],
      chain: activeChain,
    })

    const resolverReceipt = await publicClient.waitForTransactionReceipt({
      hash: resolverTx,
    })

    const [resolverLog] = parseEventLogs({
      abi: VERIFIABLE_FACTORY_ABI,
      eventName: 'ProxyDeployed',
      logs: resolverReceipt.logs,
    })

    const resolverAddress = resolverLog.args.proxyAddress

    return resolverAddress
  }

  return {
    predictProxyAddress,
    getResolverData,
    isUserResolverDeployed,
    deployResolver,
  }
}
