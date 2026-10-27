'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { sha256 } from '@noble/hashes/sha256'
import { BaseError, bytesToHex } from 'viem'
import { useAccount, useSignTypedData } from 'wagmi'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import Input from '@/components/ui/input'
import { cn } from '@/utils/tailwind'
import Image from 'next/image'
import { isLinkValid, Trash } from 'ethereum-identity-kit'
import TabSelector from '@/components/ui/tabSelector'
import ModalShell, { modalActionClassName, modalPrimaryActionClassName } from '@/components/ui/modal/modalShell'
import { getUploadScreen } from './recordsTxScreens'

interface ImageUploadModalProps {
  name: string
  imageType: 'avatar' | 'header'
  currentValue?: string
  onSave: (url: string) => void
  onClose: () => void
  allowUpload?: boolean
}

type UploadMode = 'file' | 'url'
// signing: the EIP-712 upload signature is open in the wallet; uploading: the PUT to euc.li.
type UploadStatus = 'idle' | 'signing' | 'uploading' | 'success' | 'error'

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  name,
  imageType,
  currentValue,
  onSave,
  onClose,
  allowUpload = true,
}) => {
  const { address } = useAccount()
  const { signTypedDataAsync } = useSignTypedData()

  const hasExistingUrl = currentValue && currentValue.startsWith('http')
  const [mode, setMode] = useState<UploadMode>(hasExistingUrl || !allowUpload ? 'url' : 'file')
  const [dataURL, setDataURL] = useState<string | null>(null)
  const [manualUrl, setManualUrl] = useState(hasExistingUrl ? currentValue : '')
  const [previewUrl, setPreviewUrl] = useState<string | null>(hasExistingUrl ? currentValue : null)
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [errorStatus, setErrorStatus] = useState<number | null>(null)
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isBusy = uploadStatus === 'signing' || uploadStatus === 'uploading'

  // Escape closes only this modal, not the editor under it, and does nothing while the upload runs.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopImmediatePropagation()
      if (!isBusy) onClose()
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [isBusy, onClose])

  const handleFile = useCallback((file: File) => {
    setFileInfo({ name: file.name, size: file.size })
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setDataURL(result)
      setPreviewUrl(result)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file && file.type.startsWith('image/')) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleManualUrlChange = useCallback((value: string) => {
    setManualUrl(value)
    if (value) setPreviewUrl(value)
    else setPreviewUrl(null)
  }, [])

  const dataURLToBytes = useCallback((dataUrl: string): Uint8Array => {
    const base64 = dataUrl.split(',')[1]
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }, [])

  const handleUploadAndSave = useCallback(async () => {
    if (!address) return

    if (mode === 'url') {
      if (manualUrl) {
        onSave(manualUrl)
      }
      return
    }

    if (!dataURL) return

    setUploadStatus('signing')
    setErrorMessage(null)
    setErrorDetails(null)
    setErrorStatus(null)

    try {
      const urlHash = bytesToHex(sha256(dataURLToBytes(dataURL)))
      const expiry = `${Date.now() + 1000 * 60 * 60 * 24 * 7}` // 7 days

      const sig = await signTypedDataAsync({
        primaryType: 'Upload',
        domain: { name: 'Ethereum Name Service', version: '1' },
        types: {
          Upload: [
            { name: 'upload', type: 'string' },
            { name: 'expiry', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'hash', type: 'string' },
          ],
        },
        message: {
          upload: imageType,
          expiry,
          name,
          hash: urlHash,
        },
      })

      setUploadStatus('uploading')
      const response = await fetch(`https://euc.li/${name}${imageType === 'header' ? '/h' : ''}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expiry,
          dataURL,
          sig,
          unverifiedAddress: address,
        }),
      })

      if (!response.ok) {
        setErrorStatus(response.status)
        // Thrown, so the catch below keeps the specific message instead of overwriting it.
        throw new Error(
          response.status === 413
            ? 'File size is too large (max 500KB)'
            : response.status === 415
              ? 'Unsupported file type. Use JPG/JPEG.'
              : `Upload failed: ${response.statusText || response.status}`
        )
      }

      const result = await response.json()
      const url = result.url || `https://euc.li/${name}${imageType === 'header' ? '/h' : ''}`

      setUploadStatus('success')
      onSave(url)
    } catch (err: unknown) {
      setUploadStatus('error')
      setErrorMessage(
        err instanceof BaseError ? err.shortMessage : err instanceof Error ? err.message : 'Upload failed'
      )
      setErrorDetails(err instanceof BaseError && err.message !== err.shortMessage ? err.message : null)
    }
  }, [address, mode, manualUrl, dataURL, signTypedDataAsync, imageType, name, onSave, dataURLToBytes])

  // File mode only: signing and uploading are busy screens, an error is its own screen. Success closes the modal.
  const screen =
    uploadStatus === 'signing' || uploadStatus === 'uploading' || uploadStatus === 'error'
      ? getUploadScreen({
          name,
          imageType,
          phase: uploadStatus,
          fileName: fileInfo?.name ?? null,
          fileSize: fileInfo?.size ?? null,
          preview: previewUrl,
          error: errorMessage,
          errorDetails,
          errorStatus,
          onTryAgain: () => {
            setUploadStatus('idle')
            setErrorMessage(null)
            setErrorDetails(null)
            setErrorStatus(null)
          },
          onCancel: onClose,
        })
      : null

  return (
    // Above the editor it opens from (z-100); clicks stay inside, as before.
    <div className='fixed inset-0 z-110' onClick={(e) => e.stopPropagation()}>
      <ModalShell
        title={`${imageType === 'avatar' ? 'Avatar' : 'Header'} Image`}
        onClose={onClose}
        locked={screen?.locked}
        stageKey={screen?.key ?? 'form'}
        subject={screen?.subject}
        footerHint={screen?.footerHint}
        footer={
          screen ? (
            screen.footer
          ) : (
            <>
              <PrimaryButton
                className={modalPrimaryActionClassName}
                onClick={handleUploadAndSave}
                disabled={isBusy || (mode === 'file' && !dataURL) || (mode === 'url' && !manualUrl)}
              >
                Save
              </PrimaryButton>
              <SecondaryButton className={modalActionClassName} onClick={onClose}>
                Cancel
              </SecondaryButton>
            </>
          )
        }
      >
        {screen ? (
          screen.body
        ) : (
          <>
            {allowUpload && (
              <TabSelector
                tabs={[
                  { label: 'Upload File', value: 'file' },
                  { label: 'Enter URL', value: 'url' },
                ]}
                selectedTab={mode}
                setSelectedTab={(tab) => setMode(tab as 'file' | 'url')}
              />
            )}

            {mode === 'file' ? (
              <>
                {/* Drop zone */}
                <div
                  className={cn(
                    'border-tertiary flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed transition-colors',
                    isDragging ? 'border-primary bg-primary/10' : 'hover:border-white/70'
                  )}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <Image
                      src={previewUrl}
                      alt='Preview'
                      className={cn('rounded-md object-cover', imageType === 'avatar' ? 'h-24 w-24' : 'h-24 w-full')}
                      width={512}
                      height={512}
                    />
                  ) : (
                    <>
                      <p className='text-neutral text-lg'>Drag & drop an image here</p>
                      <p className='text-neutral text-md'>or click to select a file</p>
                    </>
                  )}
                </div>
                <input ref={fileInputRef} type='file' accept='image/*' className='hidden' onChange={handleFileSelect} />
              </>
            ) : (
              <>
                <div className='flex flex-row gap-2'>
                  <Input
                    label='URL'
                    value={manualUrl}
                    onChange={(e) => handleManualUrlChange(e.target.value)}
                    placeholder='https://example.com/image.png'
                    labelClassName='w-[60px] max-w-[60px] min-w-[60px]'
                  />
                  {manualUrl && (
                    <button
                      className='group flex h-[50px] w-[50px] shrink-0 cursor-pointer items-center justify-center rounded-md border border-red-500 transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50'
                      onClick={() => {
                        setManualUrl('')
                        setPreviewUrl(null)
                        onSave('')
                      }}
                    >
                      <Trash className='h-5 w-5 text-red-500 transition-colors group-hover:text-white' />
                    </button>
                  )}
                </div>
                {previewUrl && isLinkValid(previewUrl) && URL.canParse(previewUrl) && (
                  <div className='flex justify-center'>
                    <Image
                      src={previewUrl}
                      alt='Preview'
                      className={cn('rounded-md object-cover', imageType === 'avatar' ? 'h-24 w-24' : 'h-24 w-full')}
                      width={512}
                      height={512}
                      unoptimized
                    />
                  </div>
                )}
              </>
            )}

            {errorMessage && <p className='text-md font-medium text-red-400'>{errorMessage}</p>}
          </>
        )}
      </ModalShell>
    </div>
  )
}

export default ImageUploadModal
