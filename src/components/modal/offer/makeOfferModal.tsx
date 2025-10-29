'use client'

import { useState } from 'react'
import { useSeaportClient } from '@/hooks/useSeaportClient'
import { Cross } from 'ethereum-identity-kit'
import { MarketplaceDomainType } from '@/types/domains'
import DatePicker from '@/components/ui/datepicker'
import Dropdown, { DropdownOption } from '@/components/ui/dropdown'

interface MakeOfferModalProps {
  onClose: () => void
  domain: MarketplaceDomainType | null
}

const MakeOfferModal: React.FC<MakeOfferModalProps> = ({ onClose, domain }) => {
  const { createOffer, isLoading, error } = useSeaportClient()
  const [offerPriceInEth, setOfferPriceInEth] = useState('')
  const [expiryTimestamp, setExpiryTimestamp] = useState<number | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [durationType, setDurationType] = useState<'preset' | 'custom'>('preset')
  const [presetDuration, setPresetDuration] = useState(7)
  const [success, setSuccess] = useState(false)

  const durationOptions: DropdownOption[] = [
    { value: 1, label: '1 Day' },
    { value: 3, label: '3 Days' },
    { value: 7, label: '1 Week' },
    { value: 14, label: '2 Weeks' },
    { value: 30, label: '1 Month' },
    { value: 90, label: '3 Months' },
  ]

  if (!domain) return null

  const { token_id: tokenId, name: ensName, owner: currentOwner } = domain

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess(false)

    if (!currentOwner) {
      console.error('Domain is not registered')
      return
    }

    if (durationType === 'custom') {
      if (!expiryTimestamp) {
        console.error('Please select an expiry date')
        return
      }
      // Calculate duration in days from now to expiry
      const now = Math.floor(Date.now() / 1000)
      const durationSeconds = expiryTimestamp - now
      durationDays = Math.ceil(durationSeconds / (24 * 60 * 60))
    } else {
      durationDays = presetDuration
    }

    try {
      await createOffer({
        tokenId: tokenId.toString(),
        offerPriceInEth,
        durationDays,
        currentOwner,
        ensNameId: domain.id,
      })

      setSuccess(true)

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose()
        setSuccess(false)
      }, 2000)
    } catch (err) {
      console.error('Failed to create offer:', err)
    }
  }

  console.log(domain)

  return (
    <div
      className='fixed'
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 9999,
        overflowY: 'auto',
        paddingTop: '50px',
      }}
    >
      <div
        className='bg-background border-border max-w-md rounded-lg border p-6'
        style={{ margin: '0 auto', maxWidth: '28rem' }}
      >
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='text-xl font-bold'>Make Offer on {ensName}</h2>
          <button onClick={onClose} className='rounded p-1 transition-colors hover:bg-gray-800'>
            <Cross className='h-5 w-5' />
          </button>
        </div>

        {success ? (
          <div className='py-8 text-center'>
            <div className='mb-2 text-lg font-semibold text-green-500'>Offer Created Successfully!</div>
            <p className='text-muted-foreground'>Your offer has been submitted and signed.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='mb-2 block text-sm font-medium'>Offer Price (ETH)</label>
              <input
                type='number'
                step='0.001'
                min='0'
                value={offerPriceInEth}
                onChange={(e) => setOfferPriceInEth(e.target.value)}
                className='w-full rounded-md border border-gray-700 bg-black px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none'
                placeholder='0.1'
                required
              />
            </div>

            <div className='space-y-2'>
              <Dropdown
                label='Duration'
                options={durationOptions}
                value={presetDuration}
                onSelect={(value) => {
                  setPresetDuration(value as number)
                  setDurationType('preset')
                }}
              />

              {/* Custom date option */}
              <div className='flex items-center gap-2 text-sm'>
                <button
                  type='button'
                  onClick={() => setDurationType('custom')}
                  className={`text-gray-400 transition-colors hover:text-white ${durationType === 'custom' ? 'text-white' : ''}`}
                >
                  Or select custom date
                </button>
              </div>

              {durationType === 'custom' && (
                <div className='relative'>
                  <button
                    type='button'
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className='w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-left focus:ring-2 focus:ring-purple-500 focus:outline-none'
                  >
                    {expiryTimestamp
                      ? new Date(expiryTimestamp * 1000).toLocaleString()
                      : 'Select expiry date and time'}
                  </button>
                  {showDatePicker && (
                    <div className='absolute top-full left-0 z-50 mt-2'>
                      <DatePicker
                        onSelect={(timestamp) => {
                          setExpiryTimestamp(timestamp)
                          setShowDatePicker(false)
                        }}
                        onClose={() => setShowDatePicker(false)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && <div className='text-sm text-red-500'>{error}</div>}

            <div className='text-xs text-gray-400'>
              By making an offer, you&apos;re committing to purchase this NFT if the seller accepts. The offer will be
              signed with your wallet and stored on-chain.
            </div>

            <div className='flex gap-3'>
              <button
                type='button'
                onClick={onClose}
                className='flex-1 rounded-md border border-gray-700 px-4 py-2 text-gray-300 transition-colors hover:bg-gray-800'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={isLoading || !offerPriceInEth || (durationType === 'custom' && !expiryTimestamp)}
                className='flex-1 rounded-md bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50'
              >
                {isLoading ? 'Creating...' : 'Make Offer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default MakeOfferModal
