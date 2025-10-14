import Image from 'next/image'
import Gif from '@/public/svg/chat/gif.svg'
import GifSelectPanel from './GifSelectPanel'
import { useGifControls } from '../../hooks/Gif/useGifControls'

interface GifSelectProps {
  onGifSelect?: () => void
}

const GifSelect: React.FC<GifSelectProps> = ({ onGifSelect = () => {} }) => {
  // temporary until send gif logic
  const { showGifModal, onToggleGifPanel, clickHandleRef } = useGifControls()

  return (
    <div className='relative flex items-center' ref={clickHandleRef}>
      {/* <button onClick={onToggleGifPanel}> */}
      <button>
        <Image src={Gif} alt='emoji icon' />
      </button>
      {showGifModal && <GifSelectPanel onGifSelect={onGifSelect} />}
    </div>
  )
}
export default GifSelect
