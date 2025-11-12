import { cn } from '@/utils/tailwind'
import { LoadingCell } from 'ethereum-identity-kit'

interface LoadingRowsProps {
  displayedColumns: string[]
}

const LoadingRow: React.FC<LoadingRowsProps> = ({ displayedColumns }) => {
  return displayedColumns.map((column, index) => {
    const width = `w-[${(100 - 20) / displayedColumns.length}%]`
    const nameWidth = `w-[${(100 - 20) / displayedColumns.length + 10}%]`
    const eventWidth = `w-[${(100 - 20) / displayedColumns.length + 10}%]`

    return (
      <div
        className={cn(
          'flex',
          index === displayedColumns.length - 1 && 'justify-end',
          column === 'name' ? nameWidth : column === 'event' ? eventWidth : width
        )}
        key={index}
      >
        <LoadingCell height='24px' width='70px' />
      </div>
    )
  })
}

export default LoadingRow
