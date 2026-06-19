// Plot-internal view types. Valuation domain types (Comp, CompGroup, SubjectKey)
// live in @/types/valuation.ts alongside the rest of the valuation contract.

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
