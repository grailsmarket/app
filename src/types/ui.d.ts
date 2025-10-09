export type TransactionBannerStatusType = 'inProgress' | 'success' | 'error'

export type BarGraphPointType = { x: string; y: number }
export type LineGraphPointType = { x: number; y: number }
export type GraphMarginType = {
  top: number
  right: number
  bottom: number
  left: number
}

export type TooltipPositionType = 'top' | 'left' | 'bottom' | 'right'
export type TooltipAlignType = 'left' | 'right' | 'top' | 'bottom' | 'center'

export type StatsBarOptionType = 'overview' | 'trends'
export type StatsBarDataType = {
  overview: (string | number)[]
  trends: { values: (string | number)[]; extraInfo: string[] }
}
