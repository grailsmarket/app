'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { cn } from '@/utils/tailwind'
import styles from './commemorativeArtwork.module.css'

const MAX_TILT = 14
const NEAR = 1
const FAR = 2.75
const TILT_SPRING = { stiffness: 220, damping: 22, mass: 0.6 }

const clampUnit = (value: number) => Math.min(1, Math.max(-1, value))

export const useArtworkTilt = () => {
  const reduceMotion = useReducedMotion()
  const anchor = useRef<HTMLDivElement>(null)
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const reach = useMotionValue(0)
  const x = useSpring(pointerX, TILT_SPRING)
  const y = useSpring(pointerY, TILT_SPRING)
  const lift = useSpring(reach, TILT_SPRING)
  const rotateY = useTransform(x, (value) => value * MAX_TILT)
  const rotateX = useTransform(y, (value) => -value * MAX_TILT)
  const scale = useTransform(lift, [0, 1], [1, 1.04])
  const glareX = useTransform(x, [-1, 1], [0, 100])
  const glareY = useTransform(y, [-1, 1], [0, 100])
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, #ffffff66, transparent 58%)`
  const glowOpacity = useTransform(lift, [0, 1], [0.6, 0.9])

  const track = (event: React.PointerEvent) => {
    if (reduceMotion || event.pointerType === 'touch' || !anchor.current) return
    const rect = anchor.current.getBoundingClientRect()
    const dx = event.clientX - rect.left - rect.width / 2
    const dy = event.clientY - rect.top - rect.height / 2
    const strength = Math.min(1, Math.max(0, (FAR - Math.hypot(dx, dy) / rect.width) / (FAR - NEAR)))
    pointerX.set(clampUnit(dx / (rect.width / 2)) * strength)
    pointerY.set(clampUnit(dy / (rect.height / 2)) * strength)
    reach.set(strength)
  }

  const release = () => {
    pointerX.set(0)
    pointerY.set(0)
    reach.set(0)
  }

  return {
    anchor,
    track,
    release,
    tilt: { rotateX, rotateY, scale, transformPerspective: 640 },
    glare: { backgroundImage: glare, opacity: lift },
    glowOpacity,
  }
}

interface CommemorativeArtworkProps {
  artwork: ReturnType<typeof useArtworkTilt>
  imageUrl?: string
  name?: string
  className?: string
}

const CommemorativeArtwork = ({
  artwork,
  imageUrl,
  name = 'ENS commemorative NFT',
  className,
}: CommemorativeArtworkProps) => {
  const [failedImage, setFailedImage] = useState<string>()
  const showImage = !!imageUrl && imageUrl !== failedImage

  return (
    <div ref={artwork.anchor} className={cn('relative aspect-[1024/1434]', className)}>
      <motion.div aria-hidden className={styles.glow} style={{ opacity: artwork.glowOpacity }}>
        {showImage && <Image src={imageUrl} alt='' width={256} height={359} unoptimized className={styles.ambient} />}
      </motion.div>
      <motion.div className={styles.card} style={artwork.tilt}>
        {showImage ? (
          <Image
            src={imageUrl}
            alt={name}
            width={256}
            height={359}
            unoptimized
            draggable={false}
            className='h-full w-full object-cover'
            onError={() => setFailedImage(imageUrl)}
          />
        ) : (
          <div className={styles.placeholder} aria-label='ENS commemorative NFT artwork'>
            <Image src='/logos/ens-white.svg' alt='' width={34} height={39} />
            <span>ENS V2</span>
          </div>
        )}
        <motion.div aria-hidden className={styles.glare} style={artwork.glare} />
      </motion.div>
    </div>
  )
}

export default CommemorativeArtwork
