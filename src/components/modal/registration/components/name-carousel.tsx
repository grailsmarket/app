import Link from 'next/link'
import NameImage from '@/components/ui/nameImage'
import { beautifyName } from '@/lib/ens'
import { YEAR_IN_SECONDS } from '@/constants/time'
import type { NameRegistrationEntry, CalculationResults } from '@/types/registration'

const IMAGE_SIZE = 144
const GAP = 16
const SECONDS_PER_ITEM = 3

interface NameCarouselProps {
  entries: NameRegistrationEntry[]
  calculationResults: CalculationResults | null
  onClose: () => void
}

function getExpiryDate(entry: NameRegistrationEntry, fallbackDurationSeconds: bigint): string {
  const duration = entry.calculatedDuration
    ? Number(entry.calculatedDuration)
    : Number(fallbackDurationSeconds)
  return new Date(duration * 1000 + Date.now()).toISOString()
}

const NameCarousel: React.FC<NameCarouselProps> = ({ entries, calculationResults, onClose }) => {
  const setWidth = entries.length * (IMAGE_SIZE + GAP)
  const duration = entries.length * SECONDS_PER_ITEM

  // Duplicate entries for seamless infinite loop
  const items = [...entries, ...entries, ...entries]

  return (
    <div className='-mx-lg sm:-mx-xl w-[calc(100%+var(--padding-lg)*2)] sm:w-[calc(100%+var(--padding-xl)*2)] overflow-hidden py-2'>
      <div
        className='flex hover:[animation-play-state:paused]'
        style={{
          width: `${setWidth * 2}px`,
          gap: `${GAP}px`,
          animation: `carousel-scroll ${duration}s linear infinite`,
        }}
      >
        {items.concat(items).map((entry, i) => (
          <Link
            key={`${entry.name}-${i}`}
            href={`/${entry.name}`}
            onClick={onClose}
            className='flex shrink-0 flex-col items-center gap-1.5 transition-opacity hover:opacity-70'
            style={{ width: `${IMAGE_SIZE}px` }}
          >
            <NameImage
              name={entry.name}
              tokenId={entry.domain?.token_id}
              expiryDate={getExpiryDate(
                entry,
                calculationResults?.durationSeconds ?? BigInt(YEAR_IN_SECONDS)
              )}
              className='h-36 w-36 rounded-lg'
              height={IMAGE_SIZE}
              width={IMAGE_SIZE}
            />
            <p className='w-full truncate text-center text-sm font-medium'>
              {beautifyName(entry.name)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default NameCarousel
