// Match the Google Metrics graph tooltip styling across the panel.
export const TOOLTIP_CLASS =
  'bg-secondary border-tertiary pointer-events-none absolute z-50 rounded border px-2 py-1 whitespace-nowrap'
export const TOOLTIP_SHADOW = { boxShadow: '0 4px 4px rgba(0,0,0,0.2)' } as const

// Classic layout geometry
export const CLASSIC_BAR_H = 48
export const CLASSIC_TICKS_H = 18
export const CLASSIC_SUBJECT_H = 28 // space above the bar for the subject curves to the boxes
export const CLASSIC_CURVE_GAP = 56 // vertical room for the curved connectors between bar and pills

// Derived bar bounds within the plot's top region.
export const CLASSIC_BAR_TOP = CLASSIC_SUBJECT_H
export const CLASSIC_BAR_BOTTOM = CLASSIC_SUBJECT_H + CLASSIC_BAR_H

export class ValuationEvidenceRequestError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ValuationEvidenceRequestError'
    this.status = status
    this.code = code
  }
}
