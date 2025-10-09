import HeroSearch from '@/components/home/heroSearch'
import Image from 'next/image'
import heroBackground from 'public/art/wallpapper-left.svg'
import heroBackgroundRight from 'public/art/wallpapper-right.svg'

export default function Home() {
  return (
    <main className='py-homeDesktop relative'>
      <div className='absolute top-0 left-0 w-screen h-full flex items-center justify-between'>
        <Image src={heroBackground} alt='hero-background' className='object-cover -translate-x-12 translate-y-[400px]' width={400} height={900} />
        <Image src={heroBackgroundRight} alt='hero-background' className='object-cover translate-y-72' width={600} height={1200} />
      </div>
      <div className='mx-auto h-full w-full max-w-7xl'>
        <div className='flex flex-col items-start justify-start gap-4'>
          <h1 className='font-sedan-sc text-9xl'>Your ENS Market</h1>
          <HeroSearch />
        </div>
      </div>
    </main>
  )
}
