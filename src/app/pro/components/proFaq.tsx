'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/utils/tailwind'

interface FaqItem {
  question: string
  answer: string
}

const faqs: FaqItem[] = [
  {
    question: 'Can I upgrade or downgrade my plan anytime?',
    answer:
      'Yes. You can upgrade to a higher tier at any time and your remaining subscription time will be converted proportionally. Downgrades take effect at your next renewal.',
  },
  {
    question: 'How do I pay for Grails Pro?',
    answer:
      'All subscriptions are paid in ETH on Ethereum mainnet. Simply connect your wallet, choose your plan and duration, and confirm the transaction. No fiat or credit cards required.',
  },
  {
    question: 'What happens when my subscription expires?',
    answer:
      'You will retain access to your data and settings, but premium features will be paused. You can renew or extend your subscription at any time to reactivate instantly.',
  },
  {
    question: 'Is there a refund policy?',
    answer:
      'Because subscriptions are on-chain transactions, we do not offer automatic refunds. However, if you experience a genuine issue, reach out to our support team and we will evaluate your case.',
  },
  {
    question: 'Do I need Grails Pro to use the marketplace?',
    answer:
      'No. The core marketplace is free to use. Pro unlocks advanced tools, analytics, and exclusive access designed for power users and serious collectors.',
  },
  {
    question: 'What is the Patron tier?',
    answer:
      'Patron is designed for institutions, funds, and whales who need white-glove service. It includes everything in Gold plus monthly video calls with the team, custom integrations, and direct support.',
  },
]

const QuestionItem = ({ question, answer, isLast }: { question: string; answer: string; isLast: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <div
      className={cn(
        'border-tertiary hover:bg-secondary w-full border-b-2 px-4 transition-all duration-300',
        isLast && 'border-b-0'
      )}
    >
      <button
        type='button'
        onClick={() => setIsExpanded((prev) => !prev)}
        className='flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left sm:py-6'
      >
        <h3 className='text-lg font-bold sm:text-xl'>{question}</h3>
        <motion.svg
          xmlns='http://www.w3.org/2000/svg'
          width='20'
          height='20'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2.5'
          strokeLinecap='round'
          strokeLinejoin='round'
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className='shrink-0'
        >
          <polyline points='6 9 12 15 18 9' />
        </motion.svg>
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
            className='overflow-hidden'
          >
            <div ref={contentRef} className='pb-4 sm:pb-6'>
              <p className='text-neutral leading-relaxed'>{answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const ProFaq = () => {
  return (
    <section className='mx-auto flex w-full max-w-3xl flex-col gap-8 sm:gap-10'>
      <div className='text-center'>
        <h2 className='font-sedan-sc text-4xl sm:text-5xl'>
          Frequently Asked <span className='text-primary'>Questions</span>
        </h2>
      </div>
      <div className='flex flex-col'>
        {faqs.map(({ question, answer }, index) => (
          <QuestionItem
            key={question}
            question={question}
            answer={answer}
            isLast={index === faqs.length - 1}
          />
        ))}
      </div>
    </section>
  )
}

export default ProFaq
