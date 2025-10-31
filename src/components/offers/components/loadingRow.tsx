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
          {column === 'name' && <LoadingCell width='w-32' />}
          {column === 'offer_amount' && <LoadingCell width='w-24' />}
          {column === 'offerrer' && <LoadingCell width='w-28' />}
          {column === 'expires' && <LoadingCell width='w-24' />}
          {column === 'actions' && <LoadingCell width='w-20' />}
        </div>
      ))}
    </>
  )
}

export default LoadingRow
