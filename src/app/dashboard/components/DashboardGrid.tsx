'use client'

import React, { useCallback, useMemo, useRef } from 'react'
import type { Layout, LayoutItem, ResponsiveLayouts } from 'react-grid-layout'
import { ResponsiveGridLayout, verticalCompactor, useContainerWidth } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { addComponent, updateLayouts, setColOverride, setSidebarOpen } from '@/state/reducers/dashboard'
import {
  selectDashboardComponents,
  selectDashboardLayouts,
  selectDashboardColOverride,
  selectDashboardSidebarOpen,
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
import { cn } from '@/utils/tailwind'
import LayoutSelector from './LayoutSelector'
import Image from 'next/image'
import Plus from 'public/icons/plus.svg'

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
  const colOverride = useAppSelector(selectDashboardColOverride)
  const sidebarOpen = useAppSelector(selectDashboardSidebarOpen)
  const currentBreakpointRef = useRef<DashboardBreakpoint>('lg')
  const { width, containerRef, mounted } = useContainerWidth({ measureBeforeMount: true })

  const componentIds = useMemo(() => Object.keys(components), [components, dashboard.layoutId])

  // Calculate the effective max columns for the current width
  const maxColsForCurrentWidth = getMaxColsForWidth(width)

  // If user has a column override, clamp it to what the viewport allows
  const effectiveCols = colOverride !== null ? Math.min(colOverride, maxColsForCurrentWidth) : null

  // Build cols config: either all breakpoints use the override, or use the responsive defaults
  const cols = useMemo(() => {
    if (effectiveCols !== null) {
      // Override: all breakpoints use the same column count
      return {
        lg: effectiveCols,
        md: effectiveCols,
        sm: effectiveCols,
        xs: effectiveCols,
      }
    }
    return DASHBOARD_COLS
  }, [effectiveCols])

  // Available column options the user can pick from (capped by viewport width)
  const colOptions = useMemo(() => {
    const options: number[] = []
    for (let i = 1; i <= maxColsForCurrentWidth; i++) {
      options.push(i)
    }
    return options
  }, [maxColsForCurrentWidth])

  // Deep-clone layouts on every render so RGL never touches frozen Immer objects.
  // RGL mutates layout items in-place (setting x, y, etc.) and also holds internal
  // references across renders. If we dispatch those same objects to Redux, Immer
  // freezes them, and RGL's next mutation on its cached reference throws.
  // Solution: always give RGL fresh clones, and always clone before dispatching.
  const layouts = useMemo(() => {
    const cloned: Record<string, LayoutItem[]> = {}
    for (const bp of Object.keys(reduxLayouts) as DashboardBreakpoint[]) {
      cloned[bp] = reduxLayouts[bp].map((item) => ({ ...item }))
    }
    return cloned as unknown as DashboardLayouts
  }, [reduxLayouts])

  // Debounce + clone before dispatching to Redux.
  // We clone allLayouts at capture time so Immer freezes our copy,
  // not the objects RGL continues to mutate internally.
  const layoutChangeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingLayouts = useRef<DashboardLayouts | null>(null)

  const handleLayoutChange = useCallback(
    (_currentLayout: Layout, allLayouts: ResponsiveLayouts) => {
      // Clone immediately so the dispatched object is independent of RGL internals
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
    (_layout: Layout, layoutItem: LayoutItem | undefined, _e: Event) => {
      const type = (_e as DragEvent).dataTransfer?.getData('dashboard/widget-type') as
        | DashboardComponentType
        | undefined

      if (!type || !layoutItem) return

      dispatch(
        addComponent({
          type,
          position: { x: layoutItem.x, y: layoutItem.y },
        })
      )
    },
    [dispatch]
  )

  const droppingItem = useMemo<LayoutItem>(() => ({ i: '__dropping-elem__', x: 0, y: 0, w: 1, h: 2 }), [])

  return (
    <div ref={containerRef}>
      <div className='flex items-center justify-between gap-3'>
        <div className='item-center flex gap-3'>
          <button
            onClick={() => dispatch(setSidebarOpen(!sidebarOpen))}
            className={cn(
              'border-tertiary hover:bg-secondary text-md flex h-10 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 font-medium transition-colors',
              sidebarOpen && 'bg-primary/10 border-primary/40 text-primary'
            )}
          >
            <Image
              src={Plus}
              alt='plus'
              height={16}
              width={16}
              className={cn('transition-transform', sidebarOpen && 'rotate-45')}
            />
            <p>Widgets</p>
          </button>
          {/* <span className='text-neutral text-xs font-medium'>Grid</span> */}
          <div className='bg-secondary flex rounded-md p-0.5'>
            <button
              onClick={() => dispatch(setColOverride(null))}
              className={cn(
                'cursor-pointer rounded px-2 py-1 text-lg font-medium transition-colors',
                colOverride === null ? 'bg-primary text-background' : 'text-neutral hover:text-white'
              )}
            >
              Auto
            </button>
            {colOptions.map((n) => (
              <button
                key={n}
                onClick={() => dispatch(setColOverride(n))}
                className={cn(
                  'cursor-pointer rounded px-3 py-1 text-lg font-medium transition-colors',
                  colOverride === n ? 'bg-primary text-background' : 'text-neutral hover:text-white'
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <LayoutSelector />
      </div>

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
