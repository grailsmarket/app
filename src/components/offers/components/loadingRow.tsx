import LoadingCell from '@/components/ui/loadingCell'
import { OfferColumnType } from '@/types/domains'

interface LoadingRowProps {
  displayedColumns: OfferColumnType[]
}

const LoadingRow: React.FC<LoadingRowProps> = ({ displayedColumns }) => {
  const columnWidth = `${100 / displayedColumns.length}%`

  return (
    <>
      {displayedColumns.map((column, index) => (
        <div key={`loading-${column}-${index}`} className='flex items-center' style={{ width: columnWidth }}>
          <LoadingCell width='100px' height='24px' />
        </div>
      ))}
    </>
  )
}

export default LoadingRow
