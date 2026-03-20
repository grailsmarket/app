'use client'

import { useRef, useState } from 'react'

import FREQUENTLY_ASKED_QUESTIONS from '@/constants/frequently-asked-questions'
import { cn } from '@/utils/tailwind'

interface QuestionItemProps {
  question: string
  answer: string
  isLast: boolean
}

const QuestionItem = ({ question, answer, isLast }: QuestionItemProps) => {
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
        <h3 className='text-xl font-bold sm:text-2xl'>{question}</h3>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='20'
          height='20'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2.5'
          strokeLinecap='round'
          strokeLinejoin='round'
          className={cn('shrink-0 transition-transform duration-300', isExpanded && 'rotate-180')}
        >
          <polyline points='6 9 12 15 18 9' />
        </svg>
      </button>
      <div
        className={cn('overflow-hidden transition-all duration-300 ease-in-out', isExpanded && 'pb-4 sm:pb-6')}
        style={{
          maxHeight: isExpanded ? (contentRef.current?.scrollHeight ?? 0) + 20 : 0,
        }}
      >
        <div ref={contentRef} className='custom-links'>
          <p
            dangerouslySetInnerHTML={{
              __html: answer.replaceAll('\n', '<div style="margin-top: 0.6rem;" />'),
            }}
          />
        </div>
      </div>
    </div>
  )
}

const FrequentlyAskedQuestions = () => {
  return (
    <section className='mx-auto flex max-w-5xl flex-col gap-6 sm:gap-8'>
      <h2 className='text-center text-4xl font-bold'>Frequently Asked Questions</h2>
      <div className='flex flex-col gap-0'>
        {FREQUENTLY_ASKED_QUESTIONS.map(({ question, answer }, index) => (
          <QuestionItem
            key={question}
            question={question}
            answer={answer}
            isLast={index === FREQUENTLY_ASKED_QUESTIONS.length - 1}
          />
        ))}
      </div>
    </section>
  )
}

export default FrequentlyAskedQuestions
