import { useState } from 'react'

export enum MarketplaceFiltersPanel {
  'All',
  'Categories',
}

export const usePanels = () => {
  const [panel, setPanel] = useState(MarketplaceFiltersPanel.All)

  const isPanelCategories = panel === MarketplaceFiltersPanel.Categories

  const setPanelCategories = () => {
    setPanel(MarketplaceFiltersPanel.Categories)
  }

  const setPanelAll = () => {
    setPanel(MarketplaceFiltersPanel.All)
  }

  return {
    panel,
    isPanelCategories,
    setPanelCategories,
    setPanelAll,
  }
}
