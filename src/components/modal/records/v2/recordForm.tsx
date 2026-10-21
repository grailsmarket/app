import { useState } from 'react'
import Image from 'next/image'
import { DEFAULT_FALLBACK_AVATAR, DEFAULT_FALLBACK_HEADER, ShortArrow } from 'ethereum-identity-kit'
import Input from '@/components/ui/input'
import Textarea from '@/components/ui/textarea'
import { SOCIAL_RECORDS } from '@/constants/ens/records'
import { useClickAway } from '@/hooks/useClickAway'
import PencilIcon from 'public/icons/pencil.svg'
import PlusIcon from 'public/icons/plus.svg'
import ImageUploadModal from '../components/imageUploadModal'
import { recordKey, recordLabel } from '@/utils/records/v2Records'
import type { V2Record, V2RecordField, V2RecordKind } from '@/types/records'

const profileKeys = ['description', 'status', 'location', 'url', 'email']
const placeholders: Record<string, string> = {
  description: 'Tell us about yourself...',
  status: 'What are you up to?',
  location: 'Where are you based?',
  url: 'https://yoursite.com',
  email: 'you@example.com',
  avatar: 'https://example.com/avatar.png',
  header: 'https://example.com/header.png',
}
const customTypes: { kind: V2RecordKind; label: string }[] = [
  { kind: 'text', label: 'Custom Record' },
  { kind: 'address', label: 'Address by coin type' },
  { kind: 'abi', label: 'ABI' },
  { kind: 'interface', label: 'Interface' },
  { kind: 'data', label: 'Raw data' },
]
const isAdvanced = (kind: V2RecordKind) => kind === 'abi' || kind === 'interface' || kind === 'data'
const menuItemClass =
  'hover:bg-tertiary cursor-pointer px-4 py-2 text-left text-lg font-medium transition-colors first:rounded-t-md last:rounded-b-md disabled:cursor-not-allowed disabled:opacity-50'

const RecordForm = ({
  name,
  records,
  updateRecord,
  addRecord,
  isAdding,
  allowImageUpload = true,
}: {
  name: string
  records: V2Record[]
  updateRecord: (key: string, value: string) => void
  addRecord: (field: V2RecordField) => Promise<boolean>
  isAdding: boolean
  allowImageUpload?: boolean
}) => {
  const [imageTarget, setImageTarget] = useState<'avatar' | 'header' | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [kind, setKind] = useState<V2RecordKind | null>(null)
  const [key, setKey] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [failedImages, setFailedImages] = useState<Record<string, string>>({})
  const closeAddMenu = () => {
    setIsAddOpen(false)
    setKind(null)
    setKey('')
  }
  const clickAwayRecordRef = useClickAway<HTMLDivElement>(closeAddMenu)
  const getImage = (key: string) => records.find((row) => row.kind === 'text' && row.key === key)
  const avatar = getImage('avatar')
  const header = getImage('header')
  const preview = (key: string, value: string | undefined, fallback: string) =>
    value?.startsWith('https://') && failedImages[key] !== value ? value : fallback
  const add = async (field: V2RecordField) => {
    if (records.some((row) => recordKey(row) === recordKey(field)) || (await addRecord(field))) {
      if (isAdvanced(field.kind)) setShowAdvanced(true)
      closeAddMenu()
    }
  }
  const suggestions: V2RecordField[] = [
    { kind: 'address', key: '0' },
    { kind: 'address', key: '501' },
    { kind: 'address', key: '3' },
    { kind: 'address', key: '2147483648' },
    { kind: 'name', key: '' },
  ]
  const profileRecords = records.filter(
    (row) => (row.kind === 'address' && row.key === '60') || (row.kind === 'text' && profileKeys.includes(row.key))
  )
  const addressRecords = records.filter((row) => row.kind === 'address' && row.key !== '60')
  const additionalRecords = records.filter(
    (row) =>
      row.kind !== 'address' &&
      !isAdvanced(row.kind) &&
      !(
        row.kind === 'text' &&
        (profileKeys.includes(row.key) || SOCIAL_RECORDS.some((social) => social.key === row.key))
      )
  )
  const advancedRecords = records.filter((row) => isAdvanced(row.kind))
  const renderRecord = (row: V2Record) => (
    <div key={recordKey(row)} className='flex min-w-0 flex-col gap-1'>
      {row.kind === 'text' && row.key === 'description' ? (
        <Textarea
          label='Short Bio'
          value={row.value}
          disabled={!row.editable}
          onChange={(event) => updateRecord(recordKey(row), event.target.value)}
          placeholder={placeholders.description}
        />
      ) : (
        <Input
          label={recordLabel(row)}
          type='text'
          value={row.value}
          disabled={!row.editable}
          onChange={(event) => updateRecord(recordKey(row), event.target.value)}
          spellCheck={false}
          autoComplete='off'
          labelClassName={
            row.kind === 'address' && row.key === '60'
              ? 'w-[140px]! text-nowrap'
              : row.kind === 'text' && profileKeys.includes(row.key)
                ? undefined
                : 'block w-[128px] max-w-[128px] shrink-0 break-all py-3'
          }
          placeholder={
            row.kind === 'contenthash'
              ? 'ipfs://… or 0x…'
              : row.kind === 'abi' || row.kind === 'data'
                ? 'Encoded bytes (0x…)'
                : row.kind === 'address'
                  ? row.key === '60'
                    ? '0x...'
                    : `${recordLabel(row)} address`
                  : row.kind === 'interface'
                    ? 'Implementer address (0x…)'
                    : row.kind === 'text'
                      ? placeholders[row.key] || `Value for ${row.key}`
                      : ''
          }
        />
      )}
      {!row.editable && <p className='text-neutral text-right text-xs'>Read only</p>}
      {row.kind === 'name' && (
        <p className='text-neutral text-xs'>This resolver record does not set your wallet’s primary ENS name.</p>
      )}
    </div>
  )

  return (
    <>
      <div className='relative mb-8'>
        <div className='relative h-32 w-full overflow-hidden rounded-md sm:h-36'>
          <Image
            src={preview('header', header?.value, DEFAULT_FALLBACK_HEADER)}
            alt='Header preview'
            width={1000}
            height={200}
            className='h-full w-full object-cover'
            onError={() => setFailedImages((previous) => ({ ...previous, header: header?.value || '' }))}
          />
          <button
            type='button'
            aria-label='Edit header'
            className='bg-secondary/90 hover:bg-tertiary/90 absolute top-2 right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40'
            disabled={!header?.editable}
            onClick={() => setImageTarget('header')}
          >
            <Image src={header?.value ? PencilIcon : PlusIcon} alt='' width={16} height={16} className='invert' />
          </button>
        </div>
        <div className='absolute -bottom-8.75 left-4'>
          <div className='bg-background relative h-20 w-20 overflow-hidden rounded-full sm:h-26 sm:w-26'>
            <Image
              src={preview('avatar', avatar?.value, DEFAULT_FALLBACK_AVATAR)}
              alt='Avatar preview'
              width={80}
              height={80}
              className='h-full w-full object-cover'
              onError={() => setFailedImages((previous) => ({ ...previous, avatar: avatar?.value || '' }))}
            />
            <button
              type='button'
              aria-label='Edit avatar'
              onClick={() => setImageTarget('avatar')}
              disabled={!avatar?.editable}
              className='absolute inset-0 top-2/3 flex cursor-pointer items-center justify-center bg-black/50 transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40'
            >
              <Image src={avatar?.value ? PencilIcon : PlusIcon} alt='' width={14} height={14} className='invert' />
            </button>
          </div>
        </div>
      </div>
      <div className='flex flex-col gap-3'>
        {profileRecords.map(renderRecord)}
        <div className='grid grid-cols-2 gap-3'>
          {SOCIAL_RECORDS.map((social) => {
            const row = records.find((row) => row.kind === 'text' && row.key === social.key)
            if (!row) return null
            return (
              <div key={social.key} className='flex min-w-0 flex-col gap-1'>
                <div className='flex'>
                  <div className='bg-background border-tertiary flex h-12 min-w-12 items-center justify-center rounded-l-md border border-r-0'>
                    <Image src={social.icon} alt='' width={20} height={20} />
                  </div>
                  <input
                    type='text'
                    aria-label={social.label}
                    value={row.value}
                    onChange={(event) => updateRecord(recordKey(row), event.target.value)}
                    className='bg-secondary border-tertiary hover:bg-tertiary focus:bg-tertiary flex h-12 w-full min-w-0 items-center rounded-r-md border px-3 py-2 text-left transition-colors hover:border-white/70 focus:border-white/70 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                    placeholder={social.placeholder}
                    disabled={!row.editable}
                    spellCheck={false}
                    autoComplete='off'
                  />
                </div>
                {!row.editable && <p className='text-neutral text-right text-xs'>Read only</p>}
              </div>
            )
          })}
        </div>
        {addressRecords.length > 0 && (
          <div className='flex flex-col gap-3'>
            <h3 className='text-neutral text-lg font-semibold'>Address Records</h3>
            {addressRecords.map(renderRecord)}
          </div>
        )}
        {additionalRecords.map(renderRecord)}
        {advancedRecords.length > 0 && (
          <>
            <button
              type='button'
              aria-expanded={showAdvanced}
              className='text-neutral cursor-pointer text-left text-sm underline'
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Hide' : 'Show'} advanced records ({advancedRecords.length})
            </button>
            {showAdvanced && advancedRecords.map(renderRecord)}
          </>
        )}
        <div className='relative max-w-full' ref={clickAwayRecordRef}>
          <button
            type='button'
            aria-expanded={isAddOpen}
            className='border-tertiary hover:bg-tertiary focus:bg-tertiary flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border-2 px-3 py-2 text-left transition-colors hover:border-white/70 focus:border-white/70 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
            onClick={() => (isAddOpen ? closeAddMenu() : setIsAddOpen(true))}
          >
            <Image src={PlusIcon} alt='' width={16} height={16} className='invert' />
            Add Record
          </button>
          {isAddOpen && (
            <div className='bg-secondary border-tertiary absolute bottom-12 z-10 mb-1 flex max-h-[50dvh] w-full flex-col overflow-y-auto rounded-md border shadow-lg'>
              {kind ? (
                <div className='flex flex-col gap-2 px-3 py-2'>
                  <button
                    type='button'
                    className='text-neutral flex cursor-pointer items-center gap-1 self-start text-sm hover:underline'
                    onClick={() => {
                      setKind(null)
                      setKey('')
                    }}
                  >
                    <ShortArrow className='h-3 w-3 -rotate-90' /> Record types
                  </button>
                  <label className='text-lg font-semibold' htmlFor='v2-record-key'>
                    {kind === 'address'
                      ? 'Coin type'
                      : kind === 'abi'
                        ? 'ABI content type'
                        : kind === 'interface'
                          ? 'Interface ID'
                          : kind === 'data'
                            ? 'Raw data key'
                            : 'Custom record key'}
                  </label>
                  <div className='flex items-center gap-1'>
                    <input
                      id='v2-record-key'
                      className='bg-tertiary min-w-0 flex-1 rounded-md px-3 py-1.5 text-lg font-semibold focus:outline-none'
                      value={key}
                      onChange={(event) => setKey(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && key.trim() && !isAdding) {
                          event.preventDefault()
                          void add({ kind, key: key.trim() })
                        }
                      }}
                      placeholder={
                        kind === 'address'
                          ? 'e.g. 60'
                          : kind === 'abi'
                            ? 'e.g. 1 for JSON'
                            : kind === 'interface'
                              ? '0x12345678'
                              : 'Record key...'
                      }
                      autoFocus
                    />
                    <button
                      type='button'
                      disabled={!key.trim() || isAdding}
                      onClick={() => add({ kind, key: key.trim() })}
                      className='bg-primary text-background cursor-pointer rounded-md px-3 py-1.5 text-lg font-semibold disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      {isAdding ? 'Loading…' : 'Add'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {suggestions
                    .filter((field) => !records.some((row) => recordKey(row) === recordKey(field)))
                    .map((field) => (
                      <button
                        type='button'
                        key={recordKey(field)}
                        disabled={isAdding}
                        className={menuItemClass}
                        onClick={() => add(field)}
                      >
                        {recordLabel(field)}
                      </button>
                    ))}
                  {customTypes.map((type) => (
                    <button
                      key={type.kind}
                      type='button'
                      disabled={isAdding}
                      className={menuItemClass}
                      onClick={() => setKind(type.kind)}
                    >
                      {type.label}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      {imageTarget && (
        <ImageUploadModal
          name={name}
          allowUpload={allowImageUpload}
          imageType={imageTarget}
          currentValue={getImage(imageTarget)?.value || ''}
          onClose={() => setImageTarget(null)}
          onSave={(value) => {
            updateRecord(`text:${imageTarget}`, value)
            setImageTarget(null)
          }}
        />
      )}
    </>
  )
}

export default RecordForm
