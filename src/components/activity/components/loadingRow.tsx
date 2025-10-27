import { cn } from '@/utils/tailwind'
import { LoadingCell } from 'ethereum-identity-kit'

interface LoadingRowsProps {
  displayedColumns: string[]
}

const LoadingRow: React.FC<LoadingRowsProps> = ({ displayedColumns }) => {
  return displayedColumns.map((_, index) => {
    const width = `w-[${100 / displayedColumns.length}%]`

    return (
      <div className={cn('flex', index === displayedColumns.length - 1 && 'justify-end', width)} key={index}>
        <LoadingCell height='24px' width='90px' />
      </div>
    )
  })
}

export default LoadingRow
