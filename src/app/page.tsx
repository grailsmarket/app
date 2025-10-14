import HeroSearch from '@/components/home/heroSearch'
import RecentContainer from '@/components/home/recent-container'
import Image from 'next/image'
import heroBackground from 'public/art/wallpapper-left.svg'
import heroBackgroundRight from 'public/art/wallpapper-right.svg'

const Home = () => {
  return (
    <main className='relative px-4'>
      <div className='absolute top-0 left-0 z-0 flex h-full w-screen -translate-y-56 items-center justify-between'>
        <Image
          src={heroBackground}
          alt='hero-background'
          className='-translate-x-12 object-cover'
          width={400}
          height={900}
        />
        <Image src={heroBackgroundRight} alt='hero-background' className='object-cover' width={600} height={1200} />
      </div>
      <div className='py-homeDesktop relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col gap-32'>
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
