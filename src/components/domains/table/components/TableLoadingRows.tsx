import { useMemo } from 'react'
import LoadingCell from '@/app/ui/LoadingCell'

interface TableLoadingRowsProps {
  count?: number
  showLimitedDetails?: boolean
}

const TableLoadingRows: React.FC<TableLoadingRowsProps> = ({
  count = 16,
  showLimitedDetails,
}) => {
  const headerDisplayStyle = useMemo(
    () => [
      `block w-1/3 md:w-1/3 lg:w-[29.8%]`,
      `${showLimitedDetails ? 'hidden' : 'block'} w-1/4 md:w-1/6 lg:w-[13.3%]`,
      'block w-1/4 md:w-1/6 lg:w-[17.3%]',
      'hidden md:block w-1/5 lg:w-[13.3%]',
      `hidden lg:${showLimitedDetails ? 'hidden' : 'block'} w-[13.3%]`,
      `block w-1/5 md:w-1/6 lg:w-[${showLimitedDetails ? '15%' : '13%'}]`,
    ],
    [showLimitedDetails],
  )

  return (
    <>
      {new Array(count).fill(null).map((_, index) => {
        return (
          <div
            key={index}
            className={`${
              index === 3
                ? 'hidden md:flex'
                : index >= 4
                ? 'hidden lg:flex'
                : 'flex'
            }  min-h-[60px] w-full items-center border-t border-t-dark-900 bg-dark-700 px-4 py-3`}
          >
            {headerDisplayStyle.map((style, index) => (
              <div
                className={`${style} ${index === 0 ? 'flex-1' : ''}`}
                style={{
                  width:
                    showLimitedDetails && (index === 2 || index === 3)
                      ? '25.65%'
                      : undefined,
                }}
                key={index}
              >
                <LoadingCell />
              </div>
            ))}
          </div>
        )
      })}
    </>
  )
}

export default TableLoadingRows
