import { useEffect, useRef } from 'react'
import { StaticImageData } from 'next/image'

import { formatAddress } from '@/app/utils/formatAddress'
import { generateGradientFromAddress } from '@/app/utils/generateGradientFromAddress'

export type MessageType = {
  user: { username: string; avatar: StaticImageData | string }
  message: string
  time: Date
}

const MOCKUP_MESSAGES = [
  {
    user: {
      username: 'genesis.eth',
      avatar: generateGradientFromAddress(
        '0xC983Ebc9dB969782D994627bdfFeC0ae6efee1b3',
      ),
    },
    message: 'mock',
    time: new Date('2023-08-02T08:00:00Z'), // Updated time
  },
  {
    user: {
      username: 'dan.eth',
      avatar: generateGradientFromAddress(
        '0xEA10c294b01659495932bC69c4a68A6b62326ff2',
      ),
    },
    message: 'yooooo, any alpha this morning?',
    time: new Date('2023-08-10T08:00:00Z'), // Updated time
  },
  {
    user: {
      username: formatAddress('0xf47c3037fc26Ad604152776234a0f114bB6Aab74'),
      avatar: generateGradientFromAddress(
        '0xf47c3037fc26Ad604152776234a0f114bB6Aab74',
      ),
    },
    message: 'wassup nerds',
    time: new Date('2023-08-10T09:15:00Z'), // Updated time
  },
  {
    user: {
      username: 'bandit.eth',
      avatar: generateGradientFromAddress(
        '0xBc4ABa27fFc74455597477dE5CACBBb4F8D5659e',
      ),
    },
    message: 'imagine not using ENS, cringe',
    time: new Date('2023-08-10T10:30:00Z'), // Updated time
  },
  {
    user: {
      username: formatAddress('0xf47c3037fc26Ad604152776234a0f114bB6Aab74'),
      avatar: generateGradientFromAddress(
        '0xf47c3037fc26Ad604152776234a0f114bB6Aab74',
      ),
    },
    message: "bruh, aren't you one of the founders?",
    time: new Date('2023-08-10T11:45:00Z'), // Updated time
  },
  {
    user: {
      username: 'dan.eth',
      avatar: generateGradientFromAddress(
        '0xEA10c294b01659495932bC69c4a68A6b62326ff2',
      ),
    },
    message: 'bandit the bully',
    time: new Date('2023-08-10T13:00:00Z'), // Updated time
  },
  {
    user: {
      username: 'bandit.eth',
      avatar: generateGradientFromAddress(
        '0xBc4ABa27fFc74455597477dE5CACBBb4F8D5659e',
      ),
    },
    message: 'dan, you are fired',
    time: new Date('2023-08-10T14:15:00Z'), // Updated time
  },
].sort((a, b) => a.time.getTime() - b.time.getTime())

export const useMessages = () => {
  const scrollableMessagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollableMessagesRef.current)
      scrollableMessagesRef.current.scrollTop =
        scrollableMessagesRef.current.clientHeight
  }, [scrollableMessagesRef])

  return { messages: MOCKUP_MESSAGES as MessageType[], scrollableMessagesRef }
}
