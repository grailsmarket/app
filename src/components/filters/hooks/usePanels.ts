import { useFilterContext } from '@/context/filters'
import { useEffect, useState } from 'react'

export enum MarketplaceFiltersPanel {
  'All',
  'Categories',
}

export const usePanels = () => {
  const { filterType, portfolioTab, profileTab } = useFilterContext()
  const [panel, setPanel] = useState(MarketplaceFiltersPanel.All)

  const isPanelCategories = panel === MarketplaceFiltersPanel.Categories

  useEffect(() => {
    setPanel(MarketplaceFiltersPanel.All)
  }, [filterType, portfolioTab, profileTab])

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
