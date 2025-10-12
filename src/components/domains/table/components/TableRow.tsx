import React from 'react'
import { useAccount } from 'wagmi'
import { MarketplaceDomainType, MarketplaceHeaderColumn } from '@/types/domains'
import { checkNameValidity } from '@/utils/checkNameValidity'
import { getRegistrationStatus } from '@/utils/getRegistrationStatus'
import {
  GRACE_PERIOD,
} from '@/constants/domains/registrationStatuses'
import Name from './name'
import ListPrice from './listPrice'
import RegistryPrice from './RegistryPrice'
import LastSale from './lastSale'
import HighestOffer from './highestOffer'
import Expiration from './expiration'
import Actions from './actions'

interface TableRowProps {
  domain: MarketplaceDomainType
  index: number
  displayedColumns: MarketplaceHeaderColumn[]
}

const TableRow: React.FC<TableRowProps> = ({
  domain,
  index,
  displayedColumns,
}) => {
  const { address } = useAccount()

  const domainIsValid = checkNameValidity(domain.name)
  const registrationStatus = getRegistrationStatus(domain.expiry_date)
  const cantAddToCart =
    registrationStatus === GRACE_PERIOD ||
    address?.toLowerCase() === domain.owner?.toLowerCase()

  const columnCount = displayedColumns.length

  const columns: Record<MarketplaceHeaderColumn, React.ReactNode> = {
    domain: <Name
      domain={domain}
      registrationStatus={registrationStatus}
      domainIsValid={domainIsValid}
      columnCount={columnCount}
    />,
    listed_price: <ListPrice domain={domain} registrationStatus={registrationStatus} columnCount={columnCount} />,
    registry_price: <RegistryPrice domain={domain} columnCount={columnCount} />,
    last_sale: <LastSale domain={domain} columnCount={columnCount} />,
    highest_offer: <HighestOffer domain={domain} columnCount={columnCount} />,
    expires: <Expiration domain={domain} columnCount={columnCount} registrationStatus={registrationStatus} />,
    actions: <Actions domain={domain} index={index} columnCount={columnCount} canAddToCart={cantAddToCart} />,
  }

  return (
    <div
      className='group flex flex-row justify-start h-[60px] w-full cursor-pointer items-center rounded-sm py-3 pl-4 pr-[14px] transition bg-background hover:bg-secondary'
    >
      {displayedColumns.map((column) => columns[column])}
    </div>
  )
}

export default TableRow
