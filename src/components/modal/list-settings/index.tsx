import { useState } from 'react'
import { useAccount } from 'wagmi'
import useListSettings from './hooks/use-list-settings'
import SettingsInput from './components/settings-input'
import ResetSlotWarning from './components/reset-slot-warning'
import ArrowDown from 'public/icons/arrow-down.svg'
import useSaveListSettings from './hooks/use-save-list-settings'
import { ProfileDetailsResponse } from 'ethereum-identity-kit'
import PrimaryButton from '@/components/ui/buttons/primary'
import LoadingCell from '@/components/ui/loadingCell'
import { useClickAway } from '@/hooks/useClickAway'
import { cn } from '@/utils/tailwind'
import { ChainWithDetails } from '@/lib/wagmi'
import Image from 'next/image'
import SecondaryButton from '@/components/ui/buttons/secondary'

interface ListSettingsProps {
  selectedList: number
  profile: ProfileDetailsResponse
  onClose: () => void
}

const ListSettings: React.FC<ListSettingsProps> = ({ selectedList, onClose, profile }) => {
  const [isResetSlotWarningOpen, setIsResetSlotWarningOpen] = useState(false)
  const [isEditingSettings, setIsEditingSettings] = useState(false)
  const [chainDropdownOpen, setChainDropdownOpen] = useState(false)
  const chainDropdownRef = useClickAway<HTMLDivElement>(() => {
    setChainDropdownOpen(false)
  })

  const { address: connectedAddress } = useAccount()

  const {
    user,
    owner,
    chain,
    roles,
    chains,
    setCurrentUser,
    manager,
    setChain,
    setCurrentOwner,
    listState,
    setCurrentManager,
    fetchedUser,
    currentUser,
    userLoading,
    fetchedSlot,
    fetchedOwner,
    currentOwner,
    fetchedChain,
    ownerLoading,
    changedValues,
    isPrimaryList,
    fetchedManager,
    managerLoading,
    currentManager,
    setIsPrimaryList,
    setChangedValues,
    isListSettingsLoading,
    fetchedListRecordsContractAddress,
  } = useListSettings({ profile, list: selectedList })

  const { submitChanges } = useSaveListSettings({
    slot: fetchedSlot,
    user,
    owner,
    chain,
    profile,
    manager,
    onClose,
    newChain: chain,
    listState,
    selectedList,
    changedValues,
    isPrimaryList,
    listRecordsContractAddress: fetchedListRecordsContractAddress,
  })

  const isOwner = connectedAddress?.toLowerCase() === fetchedOwner?.toLowerCase()
  const isManager = connectedAddress?.toLowerCase() === fetchedManager?.toLowerCase()
  const isUser = connectedAddress?.toLowerCase() === fetchedUser?.toLowerCase()

  return (
    <div
      onClick={onClose}
      className='fixed inset-0 z-50 flex min-h-[100dvh] w-screen items-end justify-center bg-black/40 backdrop-blur-sm transition-all duration-250 md:items-start md:overflow-y-auto md:p-4 md:py-[5vh] starting:translate-y-[100vh] md:starting:translate-y-0'
    >
      <div
        onClick={(e) => {
          e.stopPropagation()
        }}
        className='border-tertiary bg-background p-lg sm:p-xl relative flex max-h-[calc(100dvh-70px)] w-full flex-col gap-4 overflow-y-auto border-t md:max-h-none md:max-w-md md:rounded-md md:border-2'
      >
        <div className='flex w-full items-center justify-between px-3'>
          <div className='flex cursor-pointer items-center gap-2'>
            <h3 className='text-4xl font-bold'>
              List #{selectedList}
            </h3>
          </div>
          {roles?.isOwner && isOwner && (
            <button
              className={cn(
                'hover text-text flex items-center gap-2 rounded-sm bg-red-400 py-1.5 px-lg font-semibold transition-all',
                isEditingSettings
                  ? 'cursor-pointer hover:bg-red-400 hover:opacity-80'
                  : 'cursor-not-allowed opacity-60'
              )}
              onClick={() => {
                if (isEditingSettings) setIsResetSlotWarningOpen(true)
              }}
            >
              <p>Reset List</p>
              {/* <Image src='/icons/refresh.svg' alt='Refresh' width={16} height={16} className='h-auto w-4' /> */}
            </button>
          )}
        </div>
        {(user ? connectedAddress?.toLowerCase() === user.toLowerCase() : roles?.isUser) && (
          <div className='flex w-full items-center justify-between px-3'>
            <div className='flex items-center gap-2'>
              <p className='text-lg font-bold'>Set as primary</p>
              {/* <Image src='/icons/list.svg' alt='List' width={16} height={16} className='h-auto w-4' /> */}
            </div>
            <input
              className='toggle disabled:cursor-not-allowed disabled:opacity-40'
              type='checkbox'
              defaultChecked={isPrimaryList}
              onChange={(e) => {
                setIsPrimaryList(e.target.checked)
                setChangedValues((prev) => ({
                  ...prev,
                  setPrimary:
                    user.toLowerCase() === connectedAddress?.toLowerCase()
                      ? e.target.checked
                      : e.target.checked !== (Number(profile.primary_list) === selectedList),
                }))
              }}
              disabled={!isEditingSettings}
            />
          </div>
        )}
        <div className='flex w-full flex-col gap-2'>
          <div className='flex items-center gap-2 pl-3'>
            <p className='font-bold'>List Storage Location</p>
            {/* <Image src='/icons/location.svg' alt='Location' width={16} height={16} className='h-auto w-4' /> */}
          </div>
          <div className='relative w-full' ref={chainDropdownRef}>
            <button
              className='bg-secondary hover:bg-tertiary/80 flex h-[42px] w-full items-center justify-between gap-0.5 rounded-sm p-1 px-2 disabled:cursor-not-allowed disabled:opacity-75 sm:h-12 sm:px-3'
              onClick={() => setChainDropdownOpen(!chainDropdownOpen)}
              disabled={!isEditingSettings || connectedAddress?.toLowerCase() !== fetchedOwner?.toLowerCase()}
            >
              {isListSettingsLoading ? (
                <LoadingCell height='24px' width='100%' radius='4px' />
              ) : (
                <div className='flex items-center gap-2'>
                  {chain && <Image src={(chain as ChainWithDetails)?.iconUrl as string} alt={(chain as ChainWithDetails)?.name} width={24} height={24} className={'h-5 w-5 rounded-sm'} />}
                  <p className='truncate font-bold sm:text-lg'>{chain?.name}</p>
                </div>
              )}
              {isEditingSettings ? (
                <Image src='/icons/arrow-down.svg' alt='Arrow down' width={24} height={24} className={`${chainDropdownOpen ? 'rotate-180' : ''} h-5 w-5 transition-transform`} />
              ) : (
                <div />
              )}
            </button>
            {chainDropdownOpen && (
              <div className='bg-secondary shadow-small absolute top-12 z-10 flex w-full flex-col rounded-sm sm:top-14'>
                {/* @ts-expect-error - chains is a readonly array */}
                {(chains as ChainWithDetails[]).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setChain(item)
                      setChainDropdownOpen(false)
                      setChangedValues({
                        ...changedValues,
                        chain: fetchedChain?.id !== item.id,
                      })
                    }}
                    className='hover:bg-neutral/20 flex w-full cursor-pointer items-center gap-3 rounded-sm p-3'
                  >
                    <Image src={item.iconUrl as string} alt={item.name} width={24} height={24} className={'h-5 w-5 sm:h-6 sm:w-6'} />
                    <p className='truncate font-bold sm:text-lg'>{item?.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <SettingsInput
          option={'Owner'}
          Icon={'/icons/key.svg'}
          value={currentOwner}
          resolvedAddress={owner}
          placeholder={fetchedOwner}
          disableValue={fetchedOwner}
          setValue={setCurrentOwner}
          isEditingSettings={isEditingSettings}
          isLoading={ownerLoading}
          isSettingsLoading={isListSettingsLoading}
        />
        <SettingsInput
          option={'Manager'}
          Icon={'/icons/edit.svg'}
          value={currentManager}
          resolvedAddress={manager}
          placeholder={fetchedManager}
          disableValue={fetchedManager}
          setValue={setCurrentManager}
          isEditingSettings={isEditingSettings}
          isLoading={managerLoading}
          isSettingsLoading={isListSettingsLoading}
        />
        <SettingsInput
          option={'User'}
          Icon={'/icons/person.svg'}
          value={currentUser}
          resolvedAddress={user}
          placeholder={fetchedUser}
          disableValue={fetchedManager}
          setValue={setCurrentUser}
          isEditingSettings={isEditingSettings}
          isLoading={userLoading}
          isSettingsLoading={isListSettingsLoading}
        />
        <div className='flex w-full flex-col gap-2'>
          {isOwner || isManager || isUser ? (
            isEditingSettings ? (
              <div className='mt-1 flex w-full items-center justify-between'>
                {/* <CancelButton onClick={() => setIsEditingSettings(false)} /> */}
                <PrimaryButton
                  onClick={() => submitChanges()}
                  disabled={!Object.values(changedValues).includes(true)}
                  className='w-full'
                >
                  Save
                </PrimaryButton>
              </div>
            ) : (
              <SecondaryButton
                onClick={() => setIsEditingSettings(true)}
                className='w-full'
              >
                Edit settings
              </SecondaryButton>
            )
          ) : null}
          <SecondaryButton onClick={onClose} className='w-full'>
            Close
          </SecondaryButton>
        </div>
      </div>
      {roles?.isOwner && isOwner && isResetSlotWarningOpen && (
        <ResetSlotWarning
          closeModal={() => setIsResetSlotWarningOpen(false)}
          onSubmit={() => {
            const updatedValues = {
              chain: false,
              owner: false,
              manager: false,
              user: false,
              setPrimary: false,
              resetSlot: true,
            }

            setChangedValues(updatedValues)
            submitChanges(updatedValues)
          }}
        />
      )}
    </div>
  )
}

export default ListSettings
