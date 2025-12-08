'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { DomainListingType, DomainOfferType } from '@/types/domains'
import { LoadingCell } from 'ethereum-identity-kit'
import CopyIcon from 'public/icons/copy.svg'
import CheckIcon from 'public/icons/check.svg'
import DownloadIcon from 'public/icons/download.svg'

type ShareModalStatus = 'loading' | 'ready' | 'error'

interface ShareModalProps {
  onClose: () => void
  type: 'listing' | 'offer' | null
  listing: DomainListingType | null
  offer: DomainOfferType | null
  domainName: string | null
  tokenId: string | null
  expiryDate: string | null
  ownerAddress: string | null
}

const ShareModal: React.FC<ShareModalProps> = ({
  onClose,
  type,
  listing,
  offer,
  domainName,
  tokenId,
  expiryDate,
  ownerAddress,
}) => {
  const [status, setStatus] = useState<ShareModalStatus>('loading')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)

  const fetchImage = useCallback(async () => {
    if (!domainName || !tokenId) {
      setError('Missing domain information')
      setStatus('error')
      return
    }

    try {
      setStatus('loading')
      const endpoint = type === 'listing' ? '/api/og/listing' : '/api/og/offer'
      const body =
        type === 'listing'
          ? { listing, name: domainName, token_id: tokenId, expiry_date: expiryDate, owner_address: ownerAddress }
          : { offer, name: domainName, token_id: tokenId, expiry_date: expiryDate, owner_address: ownerAddress }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error('Failed to generate image')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setImageUrl(url)
      setStatus('ready')
    } catch (err) {
      setError((err as Error).message)
      setStatus('error')
    }
  }, [type, listing, offer, domainName, tokenId, expiryDate, ownerAddress])

  useEffect(() => {
    fetchImage()

    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDownload = async () => {
    if (!imageUrl || !domainName) return

    const a = document.createElement('a')
    a.href = imageUrl
    a.download = `${domainName.replace('.eth', '')}-${type}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleCopy = async () => {
    if (!imageUrl) return

    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy image:', err)
    }
  }

  if (!type) return null

  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        onClose()
      }}
      className='fixed inset-0 z-50 flex h-[100dvh] w-screen items-end justify-end bg-black/40 backdrop-blur-sm transition-all duration-250 md:items-center md:justify-center md:p-4 starting:translate-y-[100vh] md:starting:translate-y-0'
    >
      <div
        onClick={(e) => {
          e.stopPropagation()
        }}
        className='border-tertiary bg-background p-lg sm:p-xl relative mx-auto flex max-h-[calc(100dvh-80px)] w-full flex-col gap-2 overflow-y-auto border-t sm:gap-2 md:w-fit md:rounded-md md:border-2'
      >
        <div className='flex w-full flex-col items-center gap-2 sm:w-[440px]'>
          <h2 className='font-sedan-sc mb-2 text-3xl'>Share {type === 'listing' ? 'Listing' : 'Offer'}</h2>

          <div className='border-tertiary flex h-fit w-full items-center justify-center overflow-hidden rounded-lg border-2'>
            {status === 'loading' && <LoadingCell height='235px' width='100%' />}
            {status === 'error' && (
              <div className='flex flex-col items-center gap-2 p-4'>
                <p className='text-red-400'>Failed to generate image</p>
                <p className='text-neutral text-sm'>{error}</p>
                <SecondaryButton onClick={fetchImage}>Retry</SecondaryButton>
              </div>
            )}
            {status === 'ready' && imageUrl && (
              <Image src={imageUrl} alt={`${domainName} ${type}`} width={450} height={236} className='h-auto w-full' />
            )}
          </div>

          <div className='flex w-full flex-row gap-2'>
            <PrimaryButton
              onClick={handleDownload}
              disabled={status !== 'ready'}
              className='flex flex-1 items-center justify-center gap-1.5'
            >
              <Image src={DownloadIcon} alt='Download' className='h-4 w-4' />
              <p>Download</p>
            </PrimaryButton>
            <SecondaryButton onClick={handleCopy} disabled={status !== 'ready'} className='flex-1'>
              <div className='flex items-center justify-center gap-2'>
                <Image src={isCopied ? CheckIcon : CopyIcon} alt='Copy' className='h-4 w-4' />
                {isCopied ? 'Copied!' : 'Copy'}
              </div>
            </SecondaryButton>
          </div>

          <SecondaryButton onClick={onClose} className='w-full'>
            Close
          </SecondaryButton>
        </div>
      </div>
    </div>
  )
}

export default ShareModal
