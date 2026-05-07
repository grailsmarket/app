'use client'

import { useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import ProHero from './proHero'
import ProSocialProof from './proSocialProof'
import ProFeatures from './proFeatures'
import ProPricing from './proPricing'
import ProComparisonTable from './proComparisonTable'
import ProFaq from './proFaq'
import ProCta from './proCta'
import ProSubscriberHero from './proSubscriberHero'
import ProSubscriberFeatures from './proSubscriberFeatures'

const ProPageShell = () => {
  const { subscription } = useAppSelector(selectUserProfile)

  const isSubscriber =
    subscription?.tierId != null &&
    subscription.tierId > 0 &&
    (!subscription.tierExpiresAt || new Date(subscription.tierExpiresAt) > new Date())

  const isPatron = isSubscriber && subscription.tierId === 4

  if (isSubscriber) {
    return (
      <>
        <div className='relative z-10 snap-start'>
          <ProSubscriberHero tierId={subscription.tierId} tierExpiresAt={subscription.tierExpiresAt} />
        </div>

        <div className='z-10 mx-auto flex w-full max-w-[1400px] flex-col items-center gap-20 px-4 pt-12 pb-8 sm:gap-28 sm:pt-16 sm:pb-12 md:gap-36 md:px-8 md:pt-20 md:pb-16'>
          <section className='w-full snap-start'>
            <ProSubscriberFeatures userTierId={subscription.tierId} />
          </section>
          <section id='pricing comparison-table' className='flex w-full snap-start flex-col gap-10'>
            {!isPatron && <ProPricing userTierId={subscription.tierId} />}
            <ProComparisonTable />
          </section>
          <section className='w-full snap-start'>
            <ProFaq />
          </section>
        </div>
      </>
    )
  }

  return (
    <>
      <div className='relative z-10 snap-start'>
        <ProHero />
      </div>
      <section className='relative z-10 snap-start'>
        <ProSocialProof />
      </section>

      <div className='z-10 mx-auto flex w-full max-w-[1400px] flex-col items-center gap-20 px-4 pt-16 pb-8 sm:gap-28 sm:pt-24 sm:pb-12 md:gap-36 md:px-8 md:pt-32 lg:pt-40'>
        <section className='w-full snap-start'>
          <ProFeatures />
        </section>
        <section id='pricing' className='flex w-full snap-start flex-col gap-10'>
          <ProPricing />
          <ProComparisonTable />
        </section>
        <section className='w-full snap-start'>
          <ProFaq />
        </section>
        <section className='w-full snap-start'>
          <ProCta />
        </section>
      </div>
    </>
  )
}

export default ProPageShell
