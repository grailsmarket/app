import { cn } from '@/utils/tailwind'
import { LoadingCell } from 'ethereum-identity-kit'

interface LoadingRowsProps {
  displayedColumns: string[]
}

const LoadingRow: React.FC<LoadingRowsProps> = ({ displayedColumns }) => {
  return displayedColumns.map((header, index) => {
    const width = `w-[${100 / displayedColumns.length}%]`

    return (
      <div className={cn('flex', width)} key={index}>
        <LoadingCell height='24px' width='90px' />
      </div>
    )
  })
}

export default LoadingRow
