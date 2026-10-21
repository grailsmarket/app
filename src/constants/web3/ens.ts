// V1 transfers run on mainnet even when V2 is configured for a testnet.
// https://docs.ens.domains/learn/deployments/
export const ENS_V1_MAINNET_CONTRACTS = {
  registrar: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
  nameWrapper: '0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401',
} as const
