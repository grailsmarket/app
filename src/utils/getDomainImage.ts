import { numberToHex } from 'viem'

export const getDomainImage = (domain_id: number) => {
  return `https://metadata.ens.domains/mainnet/0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85/${numberToHex(domain_id)}/image`
}
