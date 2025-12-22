import { cn } from '@/utils/tailwind'
import { LoadingCell } from 'ethereum-identity-kit'

interface LoadingRowsProps {
  displayedColumns: string[]
}

const LoadingRow: React.FC<LoadingRowsProps> = ({ displayedColumns }) => {
  const basecolWidthReduction =
    (displayedColumns.includes('event') ? 10 : 0) +
    (displayedColumns.includes('name') || displayedColumns.includes('user') ? 10 : 0)
  const baseColWidth = (100 - basecolWidthReduction) / displayedColumns.length
  const columnWidth = `${baseColWidth}%`
  const nameColumnWidth = `${baseColWidth + 10}%`
  const userColumnWidth = displayedColumns.includes('name') ? `${baseColWidth}%` : `${baseColWidth + 10}%`
  const eventColumnWidth = `${baseColWidth + 10}%`

  return displayedColumns.map((column, index) => {
    return (
      <div
        className={cn('flex', index === displayedColumns.length - 1 && 'justify-end')}
        style={{
          width:
            column === 'name'
              ? nameColumnWidth
              : column === 'event'
                ? eventColumnWidth
                : column === 'user'
                  ? userColumnWidth
                  : columnWidth,
        }}
        key={index}
      >
        <LoadingCell height='24px' width='70px' />
      </div>
    )
  })
}

export default LoadingRow
