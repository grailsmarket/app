'use client'

import React, { useEffect, useId, useState } from 'react'
import Image from 'next/image'
import register from 'public/icons/registration-primary.svg'
import Search from 'public/icons/search-primary.svg'
import Grid from 'public/icons/grid-primary.svg'
import Watchlist from 'public/icons/watchlist-primary.svg'
import Message from 'public/icons/chat.svg'
import Notification from 'public/icons/bell-primary.svg'
import View from 'public/icons/view-primary.svg'
import grailsAI from 'public/icons/grails-ai.svg'
import { AnimatePresence, motion } from 'motion/react'
import { useClickAway } from '@/hooks/useClickAway'
import { Cross } from 'ethereum-identity-kit'
import DashboardImage from 'public/art/pro-features/dashboard.png'
import PrimaryButton from '@/components/ui/buttons/primary'

const tools = [
  {
    title: 'Bulk Offers',
    description: 'Create offers for multiple names at the same time.',
    longDescription:
      'This tool allows you to create offers for multiple name at once. You can easily set a base price, and then tweak offer amounts for individual names. ',
    icon: <Image src={register} alt='Register' width={24} height={24} />,
  },
  {
    title: 'Google Metrics Filters',
    description: 'Filter names by various google Google metrics like searches, CPC, and more.',
    icon: <Image src={Search} alt='Listings' width={20} height={20} />,
  },
  {
    title: 'Custom Dashboard',
    description: 'Create your custom dashboard. Add widgets to your dashboard to track your favorite metrics.',
    icon: <Image src={Grid} alt='Listings' width={20} height={20} />,
  },
  {
    title: 'Multiple Watchlists',
    description: 'Create multiple watchlists to track your favorite names.',
    icon: <Image src={Watchlist} alt='Listings' width={24} height={24} />,
  },
  {
    title: 'Private Chat Group',
    description:
      'Get access to the exclusive Grails Pro chat group, where you can chat with biggest domainers in the game.',
    icon: <Image src={Message} alt='Listings' width={20} height={20} />,
  },
  {
    title: 'Feature Notifications',
    description: 'Be the first to know about new features and updates to Grails.',
    icon: <Image src={Notification} alt='Listings' width={20} height={20} />,
  },
  {
    title: 'See view details',
    description: 'See exactly who and when viewed your profile or name pages.',
    icon: <Image src={View} alt='Listings' width={20} height={20} />,
  },
  {
    title: 'AI Search',
    description: 'Get AI recommended search terms based on your search history and market conditions.',
    longDescription:
      'Individual page on Grails, which uses our internal AI to recommend search terms based on your search history and market conditions. You can provide a list of all the names that you are interested in and the AI will recommend search terms based on your history and market conditions.',
    icon: <Image src={grailsAI} alt='Listings' width={20} height={20} />,
  },
]

const AdvancedTools = () => {
  const [active, setActive] = useState<(typeof tools)[number] | boolean | null>(null)
  const ref = useClickAway<HTMLDivElement>(() => setActive(null))
  const id = useId()

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setActive(null)
      }
    }

    if (active && typeof active === 'object') {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [active])

  return (
    <>
      <AnimatePresence>
        {active && typeof active === 'object' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-20 h-full w-full bg-black/20'
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active && typeof active === 'object' ? (
          <div className='px-lg fixed inset-0 z-100 grid place-items-center'>
            <motion.button
              key={`button-${active.title}-${id}`}
              layout
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
                transition: {
                  duration: 0.05,
                },
              }}
              className='absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full lg:hidden'
              onClick={() => setActive(null)}
            >
              <Cross className='h-auto w-7' />
            </motion.button>
            <motion.div
              layoutId={`tool-${active.title}-${id}`}
              ref={ref}
              className='dark:bg-background flex h-fit w-full max-w-[600px] flex-col overflow-scroll rounded-md bg-white shadow-lg sm:rounded-lg md:max-h-[90%]'
            >
              <motion.div layoutId={`image-${active.title}-${id}`}>
                <Image width={600} height={600} src={DashboardImage} alt={active.title} className='h-auto w-full p-4' />
              </motion.div>

              <div className='flex w-full flex-col'>
                <div className='flex items-start justify-between p-4'>
                  <div className=''>
                    <motion.h3
                      layoutId={`title-${active.title}-${id}`}
                      className='font-bold text-neutral-700 dark:text-neutral-200'
                    >
                      {active.title}
                    </motion.h3>
                    <motion.p
                      layoutId={`description-${active.description}-${id}`}
                      className='text-neutral-600 dark:text-neutral-400'
                    >
                      {active.description}
                    </motion.p>
                  </div>
                </div>
                <div className='relative px-4'>
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className='flex flex-col items-start gap-4 overflow-auto pb-6 text-xs text-neutral-600 [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch] [scrollbar-width:none] md:h-fit md:text-sm lg:text-base dark:text-neutral-400'
                  >
                    {active.longDescription || active.description}
                  </motion.div>
                </div>
                <motion.a layoutId={`button-${active.title}-${id}`} href={'/pro'} target='_blank' className='mb-4 px-4'>
                  <PrimaryButton className='w-full'>Upgrade to Pro</PrimaryButton>
                </motion.a>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
      <div className='flex w-full flex-col justify-between gap-8 xl:flex-row'>
        <div className='flex w-full flex-col items-center gap-7 lg:items-start'>
          {/* <div className='flex flex-col gap-4'>
          <h2 className='font-sedan-sc text-center text-5xl md:text-6xl lg:text-left'>Professional Domainer Tools</h2>
          <p className='text-center font-semibold sm:text-2xl lg:text-left'>
            Save gas and time. For serious domainers.
          </p>
        </div> */}
          <div className='flex w-full flex-row flex-wrap gap-4'>
            {tools.map((tool) => (
              <motion.div
                layoutId={`tool-${tool.title}-${id}`}
                className='hover:bg-primary/15 border-primary p-lg flex w-full cursor-pointer flex-col gap-2 rounded-md border transition-colors sm:w-[calc(50%-8px)] lg:w-[calc(33.33%-12px)] xl:w-[calc(25%-12px)]'
                key={`tool-${tool.title}-${id}`}
                onClick={() => setActive(tool)}
              >
                <div className='flex flex-row items-center gap-2'>
                  <motion.div layoutId={`icon-${tool.title}-${id}`}>{tool.icon}</motion.div>
                  <motion.h3 layoutId={`title-${tool.title}-${id}`} className='text-primary text-2xl font-bold'>
                    {tool.title}
                  </motion.h3>
                </div>
                <motion.p layoutId={`description-${tool.description}-${id}`} className='text-lg font-medium'>
                  {tool.description}
                </motion.p>
              </motion.div>
            ))}
          </div>
        </div>
        {/* <Image
        src={bulkToolsImage}
        alt='Bulk Tools'
        width={1200}
        height={600}
        className='mx-auto h-fit w-full max-w-[800px] lg:mx-0 xl:w-1/2'
      /> */}
      </div>
    </>
  )
}

export default AdvancedTools
