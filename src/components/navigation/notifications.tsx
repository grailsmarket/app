import React from 'react'
import Image from 'next/image'
import notifications from 'public/icons/bell.svg'

const Notifications = () => {
  return (
    <div>
      <Image src={notifications} alt='notifications' width={24} height={24} />
    </div>
  )
}

export default Notifications
