import HeroSearch from '@/components/home/heroSearch'
import RecentContainer from '@/components/home/recent-container'
import Image from 'next/image'
import heroBackground from 'public/art/wallpapper-left.svg'
import heroBackgroundRight from 'public/art/wallpapper-right.svg'

const Home = () => {
  return (
    <main className='relative px-4'>
      <div className='absolute z-0 top-0 left-0 w-screen h-full flex items-center justify-between -translate-y-56'>
        <Image src={heroBackground} alt='hero-background' className='object-cover -translate-x-12' width={400} height={900} />
        <Image src={heroBackgroundRight} alt='hero-background' className='object-cover' width={600} height={1200} />
      </div>
      <div className='mx-auto py-homeDesktop h-full relative z-10 flex flex-col gap-32 w-full max-w-7xl'>
        <div className='flex flex-col items-start justify-start gap-4'>
          <h1 className='font-sedan-sc text-9xl'>Your ENS Market</h1>
          <HeroSearch />
        </div>
        <RecentContainer />
      </div>
    </main>
  )
}

export default Home