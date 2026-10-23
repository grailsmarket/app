import AssetSummary from '@/components/ui/modal/assetSummary'
import NameImage from '@/components/ui/nameImage'
import { beautifyName } from '@/lib/ens'
import type { MarketplaceDomainType } from '@/types/domains'
import type { RenewalTotals } from '../hooks/use-renewal-modal'
import { formatExpiryDate, pluralize } from './renewal-format'

export type RenewalSubjectDomain = Pick<MarketplaceDomainType, 'name' | 'token_id' | 'version' | 'expiry_date'>

interface RenewalSubjectProps {
  domains: RenewalSubjectDomain[]
  /** The run's transaction count. */
  transactionCount: number
  /** "1 year" or "Until Mar 3, 2029". */
  durationLabel: string | null
  totals: RenewalTotals | null
  tokenLabel: string
  hasV1: boolean
  hasV2: boolean
  compact?: boolean
}

export const VersionBadge: React.FC<{ version: number }> = ({ version }) => (
  <span className='bg-tertiary text-neutral shrink-0 rounded-sm px-1.5 py-0.5 text-sm font-bold'>V{version}</span>
)

// The names being renewed, on top of the progress and error screens: one name with its version and
// current expiry, or a stack with the transaction count and duration. The price is the token total,
// with the ETH part for V1 names as its caption when both versions are in.
const RenewalSubject: React.FC<RenewalSubjectProps> = ({
  domains,
  transactionCount,
  durationLabel,
  totals,
  tokenLabel,
  hasV1,
  hasV2,
  compact,
}) => {
  const ethLabel = totals ? `${Number(totals.totalPriceETH.toFixed(4))} ETH` : null
  const assetLabel = totals ? `${totals.totalPriceAsset.toFixed(2)} ${tokenLabel}` : null
  const price = totals ? <p className='text-xl font-bold'>{hasV2 ? assetLabel : ethLabel}</p> : undefined
  const priceSub = totals && hasV1 && hasV2 ? `+ ${ethLabel}` : undefined
  const imageSize = compact ? 40 : 48

  if (domains.length === 1) {
    const domain = domains[0]

    return (
      <AssetSummary
        name={beautifyName(domain.name)}
        compact={compact}
        badge={<VersionBadge version={domain.version} />}
        meta={domain.expiry_date ? `Expires ${formatExpiryDate(new Date(domain.expiry_date).getTime())}` : undefined}
        image={
          <NameImage
            name={domain.name}
            tokenId={domain.token_id}
            version={domain.version}
            expiryDate={domain.expiry_date}
            className='h-full w-full'
            height={imageSize}
            width={imageSize}
          />
        }
        price={price}
        priceSub={priceSub}
      />
    )
  }

  return (
    <AssetSummary
      name={`${domains.length} names`}
      compact={compact}
      stack={domains.slice(0, 3).map((domain) => (
        <NameImage
          key={domain.name}
          name={domain.name}
          tokenId={domain.token_id}
          version={domain.version}
          expiryDate={domain.expiry_date}
          className='h-full w-full object-cover'
          height={imageSize}
          width={imageSize}
        />
      ))}
      meta={[pluralize(transactionCount, 'transaction'), durationLabel].filter(Boolean).join(' · ')}
      price={price}
      priceSub={priceSub}
    />
  )
}

export default RenewalSubject
