import Link from 'next/link'

const NotFound = () => {
  return (
    <main className='flex h-screen w-screen flex-col items-center justify-center gap-4'>
      <h2 className='text-2xl font-bold'>Seems like you&apos;re lost</h2>
      <p className='text-text-neutral max-w-[390px] text-center'>
        The page you&apos;re looking for doesn&apos;t really exist, sorry about that. Let&apos;s get you back home.
      </p>
      <Link href='/' className='bg-primary text-background cursor-pointer rounded-sm text-2xl font-semibold'>
        <button className='p-lg'>Return Home</button>
      </Link>
    </main>
  )
}

export default NotFound
