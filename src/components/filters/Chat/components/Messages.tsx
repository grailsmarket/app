import Image from 'next/image'

import { useMessages } from '../hooks/useMessages'

import { formatDateBetweenMessages, isSameDay } from '../utils/time'
import { formatShortTime } from '@/app/utils/time/formatShortTime'

const Messages = () => {
  const { messages, scrollableMessagesRef } = useMessages()
  return (
    <div
      ref={scrollableMessagesRef}
      className="flex flex-1 flex-col gap-8 overflow-y-auto bg-dark-700 p-4 pt-8"
    >
      {messages.map(({ time, user, message }, index: number) => {
        return (
          <div key={index} className="flex w-full flex-col gap-8">
            {(index === 0 || !isSameDay(time, messages[index - 1].time)) && (
              <p className="flex w-full justify-center text-xs font-medium leading-[18px] text-light-200">
                {formatDateBetweenMessages(time)}
              </p>
            )}
            <div className="flex w-full gap-6">
              <div>
                <Image
                  className="rounded-full"
                  src={user.avatar}
                  alt="user avatar"
                  height={32}
                  width={32}
                />
              </div>

              <div className="flex w-full flex-col">
                <div className="flex w-full items-center justify-between">
                  <p className="text-xs font-medium leading-[18px] text-purple">
                    {user.username}
                  </p>
                  <p className="text-xs font-medium leading-[18px] text-light-200">
                    {formatShortTime(time)}
                  </p>
                </div>
                <p className="text-xs font-medium leading-[18px] text-light-100">
                  {message}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
export default Messages
