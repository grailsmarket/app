import React from 'react'
import { useEFPFriends } from '../../hooks/useEFPFriends'
import { formatAddress } from '@/utils/formatAddress'
import { FollowingResponse } from '@/api/efp/getUserFollowing'
import { Avatar, HeaderImage } from 'ethereum-identity-kit'
import { beautifyName } from '@/lib/ens'
import { ENS_METADATA_URL } from '@/constants/ens'
import { Address } from 'viem'
import LoadingCell from '@/components/ui/loadingCell'
import Image from 'next/image'
import Link from 'next/link'
import { useUserContext } from '@/context/user'

interface EFPFriendsProps {
  submit: (address: Address) => void
  createChatIsPending: boolean
  search: string
}

const EFPFriends: React.FC<EFPFriendsProps> = ({ submit, createChatIsPending, search }) => {
  const { userAddress } = useUserContext()
  const { friends, isLoading, isError, hasNextPage, loadMoreRef, followingCount, isLoadingFollowingCount } =
    useEFPFriends(search)

  return (
    <div className='flex flex-col'>
      <div className='p-lg flex items-center justify-between text-xl font-semibold'>
        <div className='flex gap-1.5'>
          <Link href={`https://efp.app/${userAddress}`} target='_blank' className='transition-opacity hover:opacity-80'>
            <Image src='https://efp.app/assets/logo.svg' alt='EFP Logo' width={22} height={22} />
          </Link>
          <p>EFP Friends</p>
        </div>
        <div className='text-neutral flex items-center gap-1 text-lg'>
          {isLoadingFollowingCount ? <LoadingCell radius='4px' height='14px' width='40px' /> : <p>{followingCount}</p>}
          <p>friends</p>
        </div>
      </div>
      {friends?.map((friend, index) => (
        <FriendRow
          key={`${friend.address}-efp-friend-${index}`}
          friend={friend}
          submit={submit}
          createChatIsPending={createChatIsPending}
        />
      ))}
      {isLoading &&
        Array(10)
          .fill(0)
          .map((_, index) => (
            <div key={`loading-${index}`} className='border-tertiary border-y'>
              <LoadingCell className='h-10 w-full' width='100%' height='64px' radius='0px' />
            </div>
          ))}
      {isError && <div>Error getting EFP friends</div>}
      {hasNextPage && <div ref={loadMoreRef} className='h-1 w-full' />}
    </div>
  )
}

interface FriendRowProps {
  friend: FollowingResponse
  submit: (address: Address) => void
  createChatIsPending: boolean
}

const FriendRow: React.FC<FriendRowProps> = ({ friend, submit, createChatIsPending }) => {
  const accountENSName = friend.ens?.name
  const accountAddress = friend.address
  const displayName = accountENSName
    ? beautifyName(accountENSName)
    : accountAddress
      ? formatAddress(accountAddress)
      : null

  return (
    <button
      onClick={() => submit(friend.address)}
      disabled={createChatIsPending}
      className='bg-secondary border-tertiary hover:bg-tertiary relative flex cursor-pointer items-center gap-3 border-y p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50'
    >
      {friend.ens?.records?.['header'] && (
        <HeaderImage
          name={displayName}
          src={`${ENS_METADATA_URL}/mainnet/header/${accountENSName}`}
          isLoading={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            position: 'absolute',
            top: 0,
            left: 0,
            opacity: 0.15,
          }}
        />
      )}
      <Avatar
        address={friend.address}
        src={`${ENS_METADATA_URL}/mainnet/avatar/${accountENSName}`}
        name={displayName}
        style={{ width: '40px', height: '40px', zIndex: 10 }}
      />
      <div className='relative max-w-[calc(100%-140px)] min-w-0 flex-1'>
        <p className='text-foreground truncate font-semibold'>{displayName}</p>
        {accountAddress && <p className='text-neutral text-md truncate'>{formatAddress(accountAddress)}</p>}
      </div>
      <span className='text-primary text-md font-semibold whitespace-nowrap'>
        {createChatIsPending ? 'Opening…' : 'Start chat →'}
      </span>
    </button>
  )
}

export default EFPFriends
