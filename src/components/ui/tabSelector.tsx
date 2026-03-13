import { cn } from '@/utils/tailwind'

interface TabSelectorProps {
  tabs: {
    label: string
    value: string
  }[]
  selectedTab: string
  setSelectedTab: (tab: string) => void
  className?: string
  tabClassName?: string
}

const TabSelector: React.FC<TabSelectorProps> = ({ tabs, selectedTab, setSelectedTab, className, tabClassName }) => {
  return (
    <div className={cn('flex w-full items-center', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => setSelectedTab(tab.value)}
          className={cn(
            'border-tertiary border-b-2 py-2 text-lg font-semibold',
            tabClassName,
            `w-[${100 / tabs.length}%]`,
            selectedTab === tab.value
              ? 'text-primary border-primary font-bold'
              : 'text-neutral hover:text-foreground hover:border-foreground transition-colors'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export default TabSelector
