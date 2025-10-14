import { useEffect } from 'react'
import { JETTY_URL } from '@/app/constants/api'

interface GifSelectPanelProps {
  onGifSelect: () => void
}

const GifSelectPanel: React.FC<GifSelectPanelProps> = ({ onGifSelect }) => {
  useEffect(() => {
    const getGif = async () => {
      // placeholder until api is setup
      const req = await fetch(`${JETTY_URL}/tenor/search?q=cat`)
      const data = await req.json()
    }
    getGif()
  }, [])

  return (
    <div className='bg-dark-600 absolute right-0 bottom-full h-64 w-60 translate-x-9 -translate-y-2 gap-1 p-4'></div>
  )
}

export default GifSelectPanel
