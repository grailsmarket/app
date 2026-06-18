export type Comp = {
  name: string
  priceEth: number
  date: Date
}

// One pill per name; a name can have multiple sales (multiple bar positions).
export type CompGroup = { name: string; sales: Comp[] }

export type SubjectKey = 'low' | 'est' | 'high'

// Linear price -> axis fraction/percent mapping (0..axisMax).
export type PriceScale = {
  axisMax: number
  toFrac: (price: number) => number
  fromFrac: (frac: number) => number
  xPct: (price: number) => number
}

// A measured pill: its horizontal center and top, relative to the plot container.
export type PillAnchor = { x: number; top: number }

// Plot layout snapshot: container width + measured pill anchors by name.
export type PlotLayout = { width: number; anchors: Map<string, PillAnchor> }
