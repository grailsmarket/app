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
    <div className="absolute bottom-full right-0 h-64 w-60 -translate-y-2 translate-x-9 gap-1 bg-dark-600 p-4"></div>
  )
}

export default GifSelectPanel
