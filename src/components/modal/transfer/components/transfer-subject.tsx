import AssetSummary from '@/components/ui/modal/assetSummary'
import NameImage from '@/components/ui/nameImage'
import { beautifyName } from '@/lib/ens'
import type { TransferDomainType } from '@/state/reducers/modals/transferModal'

interface TransferSubjectProps {
  domains: TransferDomainType[]
  /** The recipient's ENS name or short address, once it is known. */
  recipientLabel: string | null
  /** Transfer transactions the names need, shown for several names. */
  transactionCount: number
  compact?: boolean
  /** One name after the transfer: the meta says who owns it now. */
  transferred?: boolean
}

export const VersionBadge: React.FC<{ version: number }> = ({ version }) =>
  version === 1 || version === 2 ? (
    <span className='bg-tertiary text-foreground inline-flex h-4.5 shrink-0 items-center rounded-sm px-1.25 text-sm leading-3.5 font-bold'>
      V{version}
    </span>
  ) : null

// The names being transferred and where they go: one name with its version, or a stack of several.
const TransferSubject: React.FC<TransferSubjectProps> = ({
  domains,
  recipientLabel,
  transactionCount,
  compact,
  transferred,
}) => {
  const [first] = domains
  if (!first) return null

  if (domains.length === 1) {
    return (
      <AssetSummary
        name={beautifyName(first.name)}
        compact={compact}
        badge={<VersionBadge version={first.version} />}
        meta={recipientLabel ? `${transferred ? 'Now owned by' : 'To'} ${recipientLabel}` : undefined}
        image={
          <NameImage
            name={first.name}
            tokenId={first.tokenId}
            version={first.version}
            expiryDate={first.expiry_date ?? null}
            className='h-full w-full'
            height={48}
            width={48}
          />
        }
      />
    )
  }

  const meta = [
    recipientLabel ? `To ${recipientLabel}` : null,
    `${transactionCount} transaction${transactionCount === 1 ? '' : 's'}`,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <AssetSummary
      name={`${domains.length} names`}
      compact={compact}
      meta={meta}
      stack={domains.slice(0, 3).map((domain) => (
        <NameImage
          key={`${domain.version}:${domain.name}`}
          name={domain.name}
          tokenId={domain.tokenId}
          version={domain.version}
          expiryDate={domain.expiry_date ?? null}
          className='h-full w-full object-cover'
          height={compact ? 40 : 48}
          width={compact ? 40 : 48}
        />
      ))}
    />
  )
}

export default TransferSubject
