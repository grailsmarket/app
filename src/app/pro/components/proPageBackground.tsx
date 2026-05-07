'use client'

import { motion, useScroll, useTransform } from 'motion/react'
import ShootingStars from '@/components/ui/shootingStars'
import StarsBackground from '@/components/ui/starsBackground'

const ProPageBackground = () => {
  const { scrollY } = useScroll()
  const starsY = useTransform(scrollY, [0, 3000], [0, 240])
  const shootingStarsY = useTransform(scrollY, [0, 3000], [0, 360])

  return (
    <div className='pointer-events-none fixed inset-0 z-0 overflow-hidden'>
      <motion.div style={{ y: starsY }} className='absolute inset-x-0 -top-[20vh] h-[140vh]'>
        <StarsBackground />
      </motion.div>
      <motion.div style={{ y: shootingStarsY }} className='absolute inset-x-0 -top-[20vh] h-[140vh]'>
        <ShootingStars />
      </motion.div>
    </div>
  )
}

export default ProPageBackground
