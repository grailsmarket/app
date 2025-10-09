import React from 'react'

interface ModalProps {
  children: React.ReactNode
  onClose: () => void
}

const Modal: React.FC<ModalProps> = ({ children, onClose }) => {
  return (
    <div
      onClick={onClose}
      className='fixed top-0 left-0 z-[100] flex h-screen w-screen justify-center overflow-scroll bg-black/40 px-2 py-12 sm:px-4'
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className='bg-background relative w-full rounded-sm p-3 sm:w-fit sm:p-4'
      >
        {children}
      </div>
    </div>
  )
}

export default Modal
