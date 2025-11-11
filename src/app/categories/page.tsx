import Categories from './components/categories'

export const metadata = {
  title: `Categories | Grails`,
  description: `Browse all categories on Grails`,
  openGraph: {
    title: `Categories | Grails`,
    siteName: `Categories | Grails`,
    description: `Browse all categories on Grails`,
    url: `https://grails.app/categories`,
    images: [{ url: `https://grails.app/categories/og` }],
  },
}

const UserPage = () => {
  return (
    <main className='px-lg min-h-screen w-full pt-20' style={{ minHeight: 'calc(100vh - 360px)' }}>
      <Categories />
    </main>
  )
}

export default UserPage
