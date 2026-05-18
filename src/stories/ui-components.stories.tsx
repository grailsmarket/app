import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ETH_ADDRESS, USDC_ADDRESS, WETH_ADDRESS } from '@/constants/web3/tokens'
import ActivityTime from '@/components/ui/activityTime'
import Asset from '@/components/ui/asset'
import Dropdown from '@/components/ui/dropdown'
import ExpandableTab from '@/components/ui/expandableTab'
import Input from '@/components/ui/input'
import Label from '@/components/ui/label'
import LoadingCell from '@/components/ui/loadingCell'
import LoadingSpinner from '@/components/ui/loadingSpinner'
import Price from '@/components/ui/price'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import TabSelector from '@/components/ui/tabSelector'
import Textarea from '@/components/ui/textarea'
import Tooltip from '@/components/ui/tooltip'

const UiComponents = () => (
  <div className='text-foreground grid w-full max-w-4xl gap-6 md:grid-cols-2'>
    <section className='border-tertiary bg-secondary flex flex-col gap-3 rounded-2xl border p-5'>
      <h2 className='text-xl font-semibold'>Buttons</h2>
      <div className='flex flex-wrap gap-3'>
        <PrimaryButton>Primary Action</PrimaryButton>
        <SecondaryButton>Secondary Action</SecondaryButton>
        <PrimaryButton disabled>Disabled</PrimaryButton>
      </div>
    </section>

    <section className='border-tertiary bg-secondary flex flex-col gap-3 rounded-2xl border p-5'>
      <h2 className='text-xl font-semibold'>Form Controls</h2>
      <Input label='Name' value='grails.eth' onChange={() => {}} />
      <Input label='Price' value='1.25' suffix='ETH' onChange={() => {}} />
      <Textarea label='Notes' value='Reusable form textarea' onChange={() => {}} />
      <Dropdown
        label='Sort'
        value='price'
        options={[
          { value: 'price', label: 'Price: low to high' },
          { value: 'expiry', label: 'Expiry date' },
          { value: 'length', label: 'Name length' },
        ]}
        onSelect={() => {}}
      />
    </section>

    <section className='border-tertiary bg-secondary flex flex-col gap-4 rounded-2xl border p-5'>
      <h2 className='text-xl font-semibold'>Data Display</h2>
      <div className='flex flex-wrap items-center gap-4'>
        <Label label='42' />
        <ActivityTime timestamp={new Date(Date.now() - 1000 * 60 * 45).toISOString()} />
        <Price price='1250000000000000000' currencyAddress={ETH_ADDRESS} usdPrice='3125' />
      </div>
      <div className='flex items-center gap-4'>
        <Asset currencyAddress={ETH_ADDRESS} iconSize='24px' />
        <Asset currencyAddress={WETH_ADDRESS} iconSize='24px' />
        <Asset currencyAddress={USDC_ADDRESS} iconSize='24px' />
      </div>
      <Tooltip label='Tooltip content' showOnMobile>
        <button className='bg-tertiary w-fit rounded-md px-3 py-2 text-lg'>Hover for tooltip</button>
      </Tooltip>
    </section>

    <section className='border-tertiary bg-secondary flex flex-col gap-4 rounded-2xl border p-5'>
      <h2 className='text-xl font-semibold'>Feedback</h2>
      <div className='flex items-center gap-4'>
        <LoadingSpinner />
        <LoadingCell width='180px' height='20px' />
      </div>
      <TabSelector
        tabs={[
          { label: 'Names', value: 'names' },
          { label: 'Activity', value: 'activity' },
          { label: 'Offers', value: 'offers' },
        ]}
        selectedTab='names'
        setSelectedTab={() => {}}
      />
      <ExpandableTab open showHeader label='Expandable Details' toggleOpen={() => {}} headerHeight={56}>
        <p className='bg-background text-neutral rounded-md p-4'>Expandable tab body content.</p>
      </ExpandableTab>
    </section>
  </div>
)

const meta = {
  title: 'Components/UI Overview',
  component: UiComponents,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof UiComponents>

export default meta

type Story = StoryObj<typeof meta>

export const Overview: Story = {}
