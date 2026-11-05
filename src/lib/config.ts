import * as z from 'zod'

const address = () => z.templateLiteral(['0x', z.string()])
const url = () => z.url({ protocol: /^https?$/ }).transform((value) => value.replace(/\/+$/, ''))
const isServer = typeof window === 'undefined'

export const serverConfigSchema = z.object({
  metadataCacheInvalidationToken: z.string().default(''),
  openseaApiKey: z.string().default(''),
})

const configSchema = z.object({
  publicChainId: z.enum(['1', '11155111']),
  walletConnectId: z.string(),

  grailsApiUrl: url(),
  ensV2ApiUrl: url(),
  ensMetadataUrl: url(),

  quicknodeId: z.string(),
  alchemy: z.object({
    mainnet: z.string(),
    sepolia: z.string(),
    base: z.string(),
    baseSepolia: z.string(),
    optimism: z.string(),
    optimismSepolia: z.string(),
  }),

  openseaApiKey: z.string().default(''),
  openseaApiUrl: url(),

  // V2 contracts
  ensV2Registry: address(),
  ensV2Registrar: address(),
  ensV2RenewerV1: address(),
  ensV2VerifiableFactory: address(),
  ensV2PermissionedResolverImpl: address(),
  ensV2MigrationHelper: address(),
  ensV2BatchRegistrar: address(),

  // V1 contracts
  ensRegistry: address(),
  ensRegistrar: address(),
  ensRegistrarController: address(),
  ensPublicResolver: address(),
  ensNameWrapper: address(),
  ensBulkRegistrar: address(),
  bulkTransferContract: address(),

  // Pay for bulk registrations/renewals with ETH. Both optional: the ETH option is hidden without them.
  ensEthRouter: address().optional(),
  uniswapV4Quoter: address().optional(),

  ensReferrerAddress: address(),

  seaportAddress: address(),
  conduitAddress: address(),
  conduitKey: address(),
  openseaConduitAddress: address(),
  openseaConduitKey: address(),
  openseaFeeRecipient: address(),
  openseaFeeBasisPoints: z.number(),

  useConduit: z.boolean(),
  canClaimPoap: z.boolean(),

  wethAddress: address(),
  usdcAddress: address(),
  daiAddress: address(),
  ensAddress: address(),
})

export const config = configSchema.parse({
  publicChainId: process.env.NEXT_PUBLIC_CHAIN_ID,
  walletConnectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,

  // Server overrides also apply to shared API clients used during server rendering.
  grailsApiUrl:
    (isServer ? process.env.GRAILS_API_URL : undefined) ||
    process.env.NEXT_PUBLIC_GRAILS_API_URL ||
    'https://api.grails.app/api/v1',
  ensV2ApiUrl: process.env.NEXT_PUBLIC_ENS_V2_API_URL,
  ensMetadataUrl: (isServer ? process.env.ENS_METADATA_URL : undefined) || process.env.NEXT_PUBLIC_ENS_METADATA_URL,

  quicknodeId: process.env.NEXT_PUBLIC_QUICKNODE_ID,
  alchemy: {
    mainnet: process.env.NEXT_PUBLIC_MAINNET_ALCHEMY_ID,
    sepolia: process.env.NEXT_PUBLIC_SEPOLIA_ALCHEMY_ID,
    base: process.env.NEXT_PUBLIC_BASE_ALCHEMY_ID,
    baseSepolia: process.env.NEXT_PUBLIC_BASE_SEPOLIA_ALCHEMY_ID,
    optimism: process.env.NEXT_PUBLIC_OPTIMISM_ALCHEMY_ID,
    optimismSepolia: process.env.NEXT_PUBLIC_OP_SEPOLIA_ALCHEMY_ID,
  },

  openseaApiKey: process.env.NEXT_PUBLIC_OPENSEA_API_KEY,
  openseaApiUrl:
    (isServer ? process.env.OPENSEA_API_URL : undefined) ||
    process.env.NEXT_PUBLIC_OPENSEA_API_URL ||
    'https://api.opensea.io',

  ensV2Registry: process.env.NEXT_PUBLIC_ENS_V2_ETH_REGISTRY,
  ensV2Registrar: process.env.NEXT_PUBLIC_ENS_V2_ETH_REGISTRAR,
  ensV2RenewerV1: process.env.NEXT_PUBLIC_ENS_V2_ETH_RENEWER_V1,
  ensV2VerifiableFactory: process.env.NEXT_PUBLIC_ENS_V2_VERIFIABLE_FACTORY,
  ensV2PermissionedResolverImpl: process.env.NEXT_PUBLIC_ENS_V2_PERMISSIONED_RESOLVER_IMPL,
  ensV2MigrationHelper: process.env.NEXT_PUBLIC_ENS_V2_MIGRATION_HELPER,
  ensV2BatchRegistrar: process.env.NEXT_PUBLIC_ENS_V2_BATCH_REGISTRAR,

  ensRegistry: process.env.NEXT_PUBLIC_ENS_REGISTRY,
  ensRegistrar: process.env.NEXT_PUBLIC_ENS_REGISTRAR,
  ensRegistrarController: process.env.NEXT_PUBLIC_ENS_REGISTRAR_CONTROLLER,
  ensPublicResolver: process.env.NEXT_PUBLIC_ENS_PUBLIC_RESOLVER,
  ensNameWrapper: process.env.NEXT_PUBLIC_ENS_NAME_WRAPPER,
  ensBulkRegistrar: process.env.NEXT_PUBLIC_ENS_BULK_REGISTRAR,
  bulkTransferContract: process.env.NEXT_PUBLIC_BULK_TRANSFER_CONTRACT,

  ensEthRouter: process.env.NEXT_PUBLIC_ENS_ETH_ROUTER || undefined,
  uniswapV4Quoter: process.env.NEXT_PUBLIC_UNISWAP_V4_QUOTER || undefined,

  ensReferrerAddress: process.env.NEXT_PUBLIC_REFERRER_ADDRESS,

  seaportAddress: process.env.NEXT_PUBLIC_SEAPORT_ADDRESS,
  conduitAddress: process.env.NEXT_PUBLIC_CONDUIT_ADDRESS,
  conduitKey: process.env.NEXT_PUBLIC_CONDUIT_KEY,
  openseaConduitAddress: process.env.NEXT_PUBLIC_OPENSEA_CONDUIT_ADDRESS,
  openseaConduitKey: process.env.NEXT_PUBLIC_OPENSEA_CONDUIT_KEY,
  openseaFeeRecipient: process.env.NEXT_PUBLIC_OPENSEA_FEE_RECIPIENT,
  openseaFeeBasisPoints: Number(process.env.NEXT_PUBLIC_OPENSEA_FEE_BASIS_POINTS),

  // Boolean('false') is true, so compare the strings (USE_CONDUIT defaulted to on before this config)
  useConduit: process.env.NEXT_PUBLIC_USE_CONDUIT !== 'false',
  canClaimPoap: process.env.NEXT_PUBLIC_CAN_CLAIM_POAP === 'true',

  // Tokens
  wethAddress: process.env.NEXT_PUBLIC_WETH_ADDRESS,
  usdcAddress: process.env.NEXT_PUBLIC_USDC_ADDRESS,
  daiAddress: process.env.NEXT_PUBLIC_DAI_ADDRESS,
  ensAddress: process.env.NEXT_PUBLIC_ENS_ADDRESS,
})
