import * as z from 'zod'

const address = () => z.templateLiteral(['0x', z.string()])

const configSchema = z.object({
  publicChainId: z.enum(['1', '11155111']),
  grailsApiUrl: z.string(),
  ensMetadataUrl: z.string(),
  walletConnectId: z.string(),

  quicknodeId: z.string(),

  alchemy: z.object({
    mainnet: z.string(),
    sepolia: z.string(),
    base: z.string(),
    baseSepolia: z.string(),
    optimism: z.string(),
    optimismSepolia: z.string(),
  }),

  openseaApiKey: z.string(),
  openseaApiUrl: z.string(),

  ensV2Registry: address(),
  ensV2Registrar: address(),
  ensV2RenewerV1: address(),
  ensV2VerifiableFactory: address(),
  ensV2PermissionedResolverImpl: address(),
  ensV2MigrationHelper: address(),
  ensV2BatchRegistrar: address(),

  ensRegistry: address(),
  ensRegistrar: address(),
  ensRegistrarController: address(),
  ensPublicResolver: address(),
  ensNameWrapper: address(),
  ensBulkRegistrar: address(),
  bulkRenewalContract: address(),
  bulkTransferContract: address(),

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
  grailsApiUrl: process.env.NEXT_PUBLIC_GRAILS_API_URL,
  ensMetadataUrl: process.env.NEXT_PUBLIC_ENS_METADATA_URL,
  walletConnectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,

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
  openseaApiUrl: process.env.NEXT_PUBLIC_OPENSEA_API_URL,

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
  bulkRenewalContract: process.env.NEXT_PUBLIC_BULK_RENEWAL_CONTRACT,
  bulkTransferContract: process.env.NEXT_PUBLIC_BULK_TRANSFER_CONTRACT,

  ensReferrerAddress: process.env.NEXT_PUBLIC_REFERRER_ADDRESS,

  seaportAddress: process.env.NEXT_PUBLIC_SEAPORT_ADDRESS,
  conduitAddress: process.env.NEXT_PUBLIC_CONDUIT_ADDRESS,
  conduitKey: process.env.NEXT_PUBLIC_CONDUIT_KEY,
  openseaConduitAddress: process.env.NEXT_PUBLIC_OPENSEA_CONDUIT_ADDRESS,
  openseaConduitKey: process.env.NEXT_PUBLIC_OPENSEA_CONDUIT_KEY,
  openseaFeeRecipient: process.env.NEXT_PUBLIC_OPENSEA_FEE_RECIPIENT,

  useConduit: process.env.NEXT_PUBLIC_USE_CONDUIT,
  canClaimPoap: process.env.NEXT_PUBLIC_CAN_CLAIM_POAP,

  // Tokens
  wethAddress: process.env.NEXT_PUBLIC_WETH_ADDRESS,
  usdcAddress: process.env.NEXT_PUBLIC_USDC_ADDRESS,
  daiAddress: process.env.NEXT_PUBLIC_DAI_ADDRESS,
  ensAddress: process.env.NEXT_PUBLIC_DAI_ADDRESS,
})
