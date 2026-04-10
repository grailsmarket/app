'use client'

import React, { useCallback, useMemo, useRef } from 'react'
import type { Layout, LayoutItem, ResponsiveLayouts } from 'react-grid-layout'
import { ResponsiveGridLayout, verticalCompactor, useContainerWidth } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { useWindowSize } from 'ethereum-identity-kit'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { dropComponent, updateLayouts } from '@/state/reducers/dashboard'
import {
  selectDashboardComponents,
  selectDashboardLayouts,
  selectDashboard,
} from '@/state/reducers/dashboard/selectors'
import {
  DASHBOARD_BREAKPOINTS,
  DASHBOARD_COLS,
  DASHBOARD_ROW_HEIGHT,
  DEFAULT_WIDGET_SIZES,
  MAX_COLS_FOR_WIDTH,
  type DashboardBreakpoint,
  type DashboardComponentType,
  type DashboardLayouts,
} from '@/state/reducers/dashboard/types'
import DashboardComponentWrapper from './DashboardComponentWrapper'
import DomainsWidget from './widgets/DomainsWidget'
import TopListWidget from './widgets/TopListWidget'
import ChartWidget from './widgets/ChartWidget'
import HoldersWidget from './widgets/HoldersWidget'
import LeaderboardWidget from './widgets/LeaderboardWidget'
import ActivityWidget from './widgets/ActivityWidget'

const renderWidget = (id: string, type: DashboardComponentType) => {
  switch (type) {
    case 'domains':
      return <DomainsWidget instanceId={id} />
    case 'top-sales':
    case 'top-offers':
    case 'top-registrations':
      return <TopListWidget instanceId={id} />
    case 'sales-chart':
    case 'offers-chart':
    case 'registrations-chart':
      return <ChartWidget instanceId={id} />
    case 'holders':
      return <HoldersWidget instanceId={id} />
    case 'leaderboard':
      return <LeaderboardWidget instanceId={id} />
    case 'activity':
      return <ActivityWidget instanceId={id} />
    default:
      return null
  }
}

// Get the max columns allowed for a given width
const getMaxColsForWidth = (w: number): number => {
  for (const { minWidth, maxCols } of MAX_COLS_FOR_WIDTH) {
    if (w >= minWidth) return maxCols
  }
  return 1
}

const DashboardGrid = () => {
  const dispatch = useAppDispatch()
  const dashboard = useAppSelector(selectDashboard)
  const reduxLayouts = useAppSelector(selectDashboardLayouts)
  const components = useAppSelector(selectDashboardComponents)
  const currentBreakpointRef = useRef<DashboardBreakpoint>('lg')
  const { width, containerRef, mounted } = useContainerWidth({ measureBeforeMount: true })
  const { width: windowWidth } = useWindowSize()

  const componentIds = useMemo(() => Object.keys(components), [components, dashboard.layoutId])

  const maxCols = getMaxColsForWidth(windowWidth ?? 0)
  const cols = useMemo(() => ({ lg: maxCols, md: maxCols, sm: maxCols, xs: maxCols }), [maxCols])

  const layouts = useMemo(() => {
    const cloned: Record<string, LayoutItem[]> = {}
    for (const bp of Object.keys(reduxLayouts) as DashboardBreakpoint[]) {
      cloned[bp] = reduxLayouts[bp].map((item) => ({ ...item }))
    }
    return cloned as unknown as DashboardLayouts
  }, [reduxLayouts])

  const layoutChangeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingLayouts = useRef<DashboardLayouts | null>(null)

  const handleLayoutChange = useCallback(
    (_currentLayout: Layout, allLayouts: ResponsiveLayouts) => {
      const snapshot: Record<string, LayoutItem[]> = {}
      for (const bp of Object.keys(allLayouts)) {
        const items = allLayouts[bp]
        if (items) {
          snapshot[bp] = (items as LayoutItem[]).map((item) => ({ ...item }))
        }
      }
      pendingLayouts.current = snapshot as unknown as DashboardLayouts

      if (layoutChangeTimer.current) clearTimeout(layoutChangeTimer.current)
      layoutChangeTimer.current = setTimeout(() => {
        if (pendingLayouts.current) {
          dispatch(updateLayouts(pendingLayouts.current))
          pendingLayouts.current = null
        }
      }, 300)
    },
    [dispatch]
  )

  const handleBreakpointChange = useCallback((newBreakpoint: string) => {
    currentBreakpointRef.current = newBreakpoint as DashboardBreakpoint
  }, [])

  const handleDrop = useCallback(
    (layoutAfterDrop: Layout, _layoutItem: LayoutItem | undefined, _e: Event) => {
      const type = (_e as DragEvent).dataTransfer?.getData('dashboard/widget-type') as
        | DashboardComponentType
        | undefined

      if (!type) return

      dispatch(
        dropComponent({
          type,
          resolvedLayout: (layoutAfterDrop as LayoutItem[]).map((item) => ({ ...item })),
          breakpoint: currentBreakpointRef.current,
        })
      )
    },
    [dispatch]
  )

  const droppingItem = useMemo<LayoutItem>(() => ({ i: '__dropping-elem__', x: 0, y: 0, w: 1, h: 2 }), [])

  return (
    <div ref={containerRef}>
      {componentIds.length === 0 && (
        <div className='fixed top-full left-full flex w-80 -translate-x-[calc(50vw+160px)] -translate-y-[50vh] flex-col items-center justify-center gap-3 text-center'>
          <p className='text-neutral text-xl font-medium'>Your dashboard is empty</p>
          <p className='text-neutral text-lg'>Open the sidebar and drag components here to build your dashboard.</p>
        </div>
      )}
      {mounted ? (
        <ResponsiveGridLayout
          width={width}
          layouts={layouts}
          breakpoints={DASHBOARD_BREAKPOINTS}
          cols={cols}
          rowHeight={DASHBOARD_ROW_HEIGHT}
          onLayoutChange={handleLayoutChange}
          onBreakpointChange={handleBreakpointChange}
          onDrop={handleDrop}
          dropConfig={{ enabled: true, defaultItem: { w: 1, h: 2 } }}
          droppingItem={droppingItem}
          dragConfig={{ enabled: true, handle: '.dashboard-drag-handle' }}
          resizeConfig={{ enabled: true, handles: ['se'] }}
          compactor={verticalCompactor}
          margin={[12, 12]}
          containerPadding={[0, 12]}
          style={{
            minHeight: '50vh',
          }}
        >
          {componentIds.map((id) => {
            const config = components[id]
            if (!config) return null

            const sizes = DEFAULT_WIDGET_SIZES[config.type]

            return (
              <div key={id} data-grid={{ minW: sizes.minW, minH: sizes.minH }}>
                <DashboardComponentWrapper id={id} type={config.type}>
                  {renderWidget(id, config.type)}
                </DashboardComponentWrapper>
              </div>
            )
          })}
        </ResponsiveGridLayout>
      ) : null}
    </div>
  )
}

export default DashboardGrid
