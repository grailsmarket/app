import HeroSearch from '@/components/home/heroSearch'
import LiveActivity from '@/components/home/liveActivity'
import RecentContainer from '@/components/home/recent-container'

const Home = () => {
  return (
    <main className='relative md:px-4'>
      {/* <div className='absolute top-0 left-0 z-0 flex h-full w-screen -translate-y-56 items-center justify-between'>
        <Image
          src={heroBackground}
          alt='hero-background'
          className='-translate-x-12 object-cover'
          width={400}
          height={900}
        />
        <Image src={heroBackgroundRight} alt='hero-background' className='object-cover' width={600} height={1200} />
      </div> */}
      <div className='md:pt-homeDesktop sm:pb-lg z-10 mx-auto flex h-full w-full flex-col items-center gap-4 pt-24 sm:pt-36'>
        <div className='mb-2 flex w-full max-w-7xl flex-col items-start justify-start gap-4 px-4 sm:mb-20 md:px-0'>
          <h1 className='font-sedan-sc text-5xl sm:text-9xl'>Your ENS Market</h1>
          <HeroSearch />
        </div>
        <div className='2xl:max-w-domain-panel mx-auto flex w-full max-w-7xl flex-col gap-0 md:gap-4 2xl:flex-row-reverse'>
          <div className='w-full 2xl:h-[1000px] 2xl:w-2/5'>
            <RecentContainer />
          </div>
          <div className='w-full 2xl:w-3/5'>
            <LiveActivity />
          </div>
        </div>
      </div>
    </main>
  )
}

export default Home
