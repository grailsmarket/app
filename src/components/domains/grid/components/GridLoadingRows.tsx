import React from 'react'
import LoadingCard from './loadingCard'

interface GridLoadingRowsProps {
  count?: number
}

const GridLoadingRows: React.FC<GridLoadingRowsProps> = ({ count = 29 }) => {
  return (
    <>
      {new Array(count).fill(null).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </>
  )
}

export default GridLoadingRows
