import { ALL_MARKETPLACE_COLUMNS } from '@/constants/domains/marketplaceDomains'
import { cn } from '@/utils/tailwind'
import { MarketplaceHeaderColumn } from '@/types/domains'
import { LoadingCell } from 'ethereum-identity-kit'

interface TableLoadingRowsProps {
  displayedColumns: MarketplaceHeaderColumn[]
}

const TableLoadingRow: React.FC<TableLoadingRowsProps> = ({ displayedColumns }) => {
  return displayedColumns.map((header, index) => {
    const item = ALL_MARKETPLACE_COLUMNS[header]
    return (
      <div
        className={cn(
          'flex items-center gap-2',
          item.getWidth(displayedColumns.length),
          index === displayedColumns.length - 1 && 'justify-end'
        )}
        key={index}
      >
        {header === 'domain' && <LoadingCell height='36px' width='36px' radius='4px' />}
        <LoadingCell height='22px' width='90px' />
      </div>
    )
  })
}

export default TableLoadingRow
