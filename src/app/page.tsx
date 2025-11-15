import HeroSearch from '@/components/home/heroSearch'
import LiveActivity from '@/components/home/liveActivity'
import RecentContainer from '@/components/home/recent-container'

const Home = () => {
  return (
    <main className='relative'>
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
      <div className='lg:pt-homeDesktop z-10 mx-auto flex h-full w-full flex-col items-center gap-4 pt-24 md:pt-36'>
        <div className='mb-2 flex w-full max-w-[1296px] flex-col items-start justify-start gap-4 px-4 md:mb-20'>
          <h1 className='font-sedan-sc text-5xl sm:text-9xl'>Your ENS Market</h1>
          <HeroSearch />
        </div>
        <div className='flex w-full flex-col gap-0 lg:flex-row-reverse'>
          <RecentContainer />
          <div className='bg-secondary w-full overflow-y-scroll lg:w-3/5'
            style={{
              height: 'calc(100vh - 78px)',
            }}
          >
            <LiveActivity />
          </div>
        </div>
      </div>
    </main>
  )
}

export default Home
