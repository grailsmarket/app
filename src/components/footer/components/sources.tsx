import Link from 'next/link'

const footerSources = [
  {
    text: 'GitHub',
    href: 'https://github.com/grailsmarket',
    target: '_blank',
  },
  {
    text: 'Discord',
    href: 'https://discord.com/invite/ZUyG3mSXFD',
    target: '_blank',
  },
  {
    text: 'Twitter',
    href: 'https://twitter.com/grailsmarket',
    target: '_blank',
  },
]

const Sources = () => {
  return (
    <div className='flex flex-col gap-4'>
      {footerSources.map((source) => (
        <div
          className='text-foreground/80 hover:text-foreground w-fit text-lg font-medium transition-transform'
          key={`source-${source.href}`}
        >
          <Link href={source.href} target={source.target} rel='noreferrer'>
            <span>{source.text}</span>
          </Link>
        </div>
      ))}
    </div>
  )
}

export default Sources
