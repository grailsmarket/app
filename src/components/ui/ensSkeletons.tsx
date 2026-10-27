import LoadingSkeleton, { Skeleton } from './loadingSkeleton'
import { cn } from '@/utils/tailwind'

interface ContentSkeletonProps {
  label?: string
  className?: string
}

interface FieldSkeletonProps {
  className?: string
}

export const FieldSkeleton: React.FC<FieldSkeletonProps> = ({ className }) => (
  <div aria-hidden='true' className={cn('border-tertiary flex min-h-12 overflow-hidden rounded-md border', className)}>
    <div className='border-tertiary flex w-25 shrink-0 items-center border-r px-4'>
      <Skeleton className='w-16' />
    </div>
    <div className='bg-secondary flex min-w-0 flex-1 items-center px-4'>
      <Skeleton className='w-2/3' />
    </div>
  </div>
)

interface RecordsSkeletonProps extends ContentSkeletonProps {
  configuration?: boolean
}

export const RecordsSkeleton: React.FC<RecordsSkeletonProps> = ({
  label = 'Loading records and permissions…',
  className,
  configuration = false,
}) => (
  <LoadingSkeleton label={label} className={cn('w-full max-w-3xl', className)}>
    <div className='flex flex-col gap-3'>
      {configuration && <FieldSkeleton className='mb-2' />}
      <div className='relative mb-8'>
        <Skeleton className='block h-32 rounded-md sm:h-36' />
        <div className='bg-background absolute -bottom-8.75 left-4 rounded-full p-1'>
          <Skeleton className='block h-20 w-20 rounded-full sm:h-26 sm:w-26' />
        </div>
      </div>
      {Array.from({ length: 6 }, (_, index) => (
        <FieldSkeleton key={index} className={index === 1 ? 'min-h-24' : undefined} />
      ))}
      <div className='grid grid-cols-2 gap-3'>
        <FieldSkeleton />
        <FieldSkeleton />
      </div>
    </div>
  </LoadingSkeleton>
)

interface TableRowsSkeletonProps {
  columns: number
  rows?: number
  nameImage?: boolean
  actionColumn?: boolean
}

export const TableRowsSkeleton: React.FC<TableRowsSkeletonProps> = ({
  columns,
  rows = 4,
  nameImage = false,
  actionColumn = false,
}) => (
  <>
    {Array.from({ length: rows }, (_, row) => (
      <tr key={row} aria-hidden='true' className='border-tertiary border-b last:border-b-0'>
        {Array.from({ length: columns }, (_, column) => (
          <td key={column} className='px-2.5 py-4 sm:px-4'>
            <div className='flex items-center gap-2'>
              {column === 0 && nameImage && <Skeleton className='h-8 w-8 shrink-0 rounded-md' />}
              <Skeleton
                className={
                  column === 0
                    ? row % 2
                      ? 'w-36 max-w-full'
                      : 'w-48 max-w-full'
                    : actionColumn && column === columns - 1
                      ? 'h-3.5 w-3.5'
                      : 'w-14'
                }
              />
            </div>
          </td>
        ))}
      </tr>
    ))}
  </>
)

interface TableSkeletonProps extends ContentSkeletonProps {
  columns: string[]
  rows?: number
  nameImage?: boolean
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  label = 'Loading…',
  columns,
  rows,
  nameImage,
  className,
}) => (
  <LoadingSkeleton label={label} className={cn('overflow-x-auto', className)}>
    <table className='w-full text-left text-lg'>
      <thead>
        <tr>
          {columns.map((column, index) => (
            <th
              key={index}
              className='text-neutral border-tertiary border-b px-2.5 pb-3 font-medium whitespace-nowrap sm:px-4'
            >
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <TableRowsSkeleton
          columns={columns.length}
          rows={rows}
          nameImage={nameImage}
          actionColumn={columns.at(-1) === ''}
        />
      </tbody>
    </table>
  </LoadingSkeleton>
)

export const ConfigurationTableSkeleton: React.FC<ContentSkeletonProps> = ({ className }) => (
  <div className={cn('flex flex-col gap-4', className)}>
    <LoadingSkeleton label='Loading configurations…' className='px-3 pt-3'>
      <div className='flex items-center justify-between gap-3'>
        <Skeleton className='w-32' />
        <Skeleton className='h-9 w-28' />
      </div>
    </LoadingSkeleton>
    <TableSkeleton columns={['Configuration', 'Records', 'Names', 'ID', '']} rows={3} label='Loading configurations…' />
  </div>
)

export const ConfigurationGroupsSkeleton = () => (
  <div className='flex flex-col gap-3'>
    {[0, 1].map((index) => (
      <div key={index} className='border-tertiary overflow-hidden rounded-md border'>
        <LoadingSkeleton label='Loading resolver…' className='bg-secondary px-4 py-3'>
          <Skeleton className='h-5 w-64 max-w-full' />
        </LoadingSkeleton>
        <ConfigurationTableSkeleton />
      </div>
    ))}
  </div>
)

export const NamesSkeleton = () => (
  <div className='flex flex-col gap-3'>
    <FieldSkeleton />
    <TableSkeleton columns={['Name', 'Configuration', '']} nameImage label='Loading name assignments…' />
  </div>
)

interface NameListSkeletonProps extends ContentSkeletonProps {
  rows?: number
  checkboxes?: boolean
}

export const NameListSkeleton: React.FC<NameListSkeletonProps> = ({
  label = 'Loading your names…',
  className,
  rows = 3,
  checkboxes = false,
}) => (
  <LoadingSkeleton label={label} className={className}>
    {Array.from({ length: rows }, (_, index) => (
      <div key={index} className='border-tertiary flex items-center gap-3 border-b px-3 py-3 last:border-b-0'>
        {checkboxes && <Skeleton className='h-5 w-5 shrink-0' />}
        <Skeleton className='h-8 w-8 shrink-0 rounded-md' />
        <Skeleton className={index % 2 ? 'w-28 max-w-full' : 'w-40 max-w-full'} />
      </div>
    ))}
  </LoadingSkeleton>
)

interface PermissionsSkeletonProps extends ContentSkeletonProps {
  expanded?: boolean
  accounts?: number
}

export const PermissionsSkeleton: React.FC<PermissionsSkeletonProps> = ({
  label = 'Loading permissions…',
  className,
  expanded = false,
  accounts = 2,
}) => (
  <LoadingSkeleton label={label} className={className}>
    <div className='flex flex-col gap-3'>
      {Array.from({ length: accounts }, (_, index) => (
        <div key={index} className='border-tertiary overflow-hidden rounded-md border'>
          <div className='bg-secondary flex min-h-12 items-center gap-3 px-4 py-3'>
            <Skeleton className='h-6 w-6 shrink-0 rounded-full' />
            <Skeleton className='w-40 max-w-full' />
          </div>
          {expanded &&
            [0, 1, 2].map((row) => (
              <div key={row} className='border-tertiary flex items-center gap-4 border-t px-4 py-3'>
                <Skeleton className='mr-auto w-1/3' />
                <Skeleton className='h-5 w-5' />
                <Skeleton className='h-5 w-5' />
              </div>
            ))}
        </div>
      ))}
    </div>
  </LoadingSkeleton>
)

interface ProfileSkeletonProps {
  notifications?: boolean
}

export const ProfileSkeleton: React.FC<ProfileSkeletonProps> = ({ notifications = false }) => (
  <LoadingSkeleton label='Loading your profile…' className='w-full max-w-2xl'>
    <div className='flex flex-col gap-4'>
      <Skeleton className='hidden h-6 w-40 md:block' />
      <Skeleton className='w-3/4' />
      {notifications ? (
        <div className='border-tertiary divide-tertiary divide-y rounded-md border'>
          {[0, 1, 2].map((index) => (
            <div key={index} className='flex items-center justify-between gap-4 p-4'>
              <div className='flex flex-1 flex-col gap-2'>
                <Skeleton className='w-28' />
                <Skeleton className='w-3/4' />
              </div>
              <Skeleton className='h-6 w-11 rounded-full' />
            </div>
          ))}
        </div>
      ) : (
        <div className='border-tertiary flex flex-wrap items-center gap-3 rounded-md border p-4'>
          <Skeleton className='h-12 w-12 rounded-full' />
          <div className='flex min-w-0 flex-1 flex-col gap-2'>
            <Skeleton className='h-5 w-40 max-w-full' />
            <Skeleton className='w-48 max-w-full' />
          </div>
          <Skeleton className='h-9 w-40' />
        </div>
      )}
      <FieldSkeleton />
    </div>
  </LoadingSkeleton>
)

interface SettingsSkeletonProps {
  section: string
}

export const SettingsSkeleton: React.FC<SettingsSkeletonProps> = ({ section }) => (
  <div className='flex min-w-0 flex-col gap-4 md:flex-row md:gap-6 xl:gap-8'>
    <LoadingSkeleton label='Checking your wallet…' className='border-tertiary shrink-0 md:w-48 md:border-r md:pr-6'>
      <Skeleton className='mb-4 hidden h-8 w-28 md:block' />
      <div className='flex gap-3 md:flex-col'>
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className='h-9 flex-1 md:w-full md:flex-none' />
        ))}
      </div>
    </LoadingSkeleton>
    <div className='min-w-0 flex-1'>
      {section === 'resolvers' ? (
        <TableSkeleton
          columns={['Resolver', 'Your access', 'Configs.', 'Names', 'Updated', '']}
          label='Loading resolvers…'
        />
      ) : section === 'records' ? (
        <ConfigurationGroupsSkeleton />
      ) : (
        <ProfileSkeleton notifications={section === 'notifications'} />
      )}
    </div>
  </div>
)

export const ReviewSkeleton: React.FC<ContentSkeletonProps> = ({ label = 'Loading details…', className }) => (
  <LoadingSkeleton label={label} className={className}>
    <div className='flex flex-col gap-3'>
      <div className='border-tertiary bg-secondary flex flex-col gap-3 rounded-md border p-4'>
        <Skeleton className='h-5 w-1/3' />
        <Skeleton className='w-5/6' />
        <Skeleton className='w-2/3' />
      </div>
      <FieldSkeleton />
      <FieldSkeleton />
    </div>
  </LoadingSkeleton>
)

interface RecordListSkeletonProps extends ContentSkeletonProps {
  rows?: number
}

export const RecordListSkeleton: React.FC<RecordListSkeletonProps> = ({
  label = 'Loading records…',
  className,
  rows = 3,
}) => (
  <LoadingSkeleton label={label} className={cn('border-tertiary rounded-md border', className)}>
    {Array.from({ length: rows }, (_, index) => (
      <div key={index} className='border-tertiary flex flex-col gap-2 border-b px-3 py-2 last:border-b-0'>
        <Skeleton className='h-3 w-24' />
        <Skeleton className={index % 2 ? 'w-2/3' : 'w-5/6'} />
      </div>
    ))}
  </LoadingSkeleton>
)

export const CostSkeleton: React.FC<ContentSkeletonProps> = ({ label = 'Loading costs…', className }) => (
  <LoadingSkeleton label={label} className={cn('bg-secondary border-tertiary rounded-lg border p-3', className)}>
    <div className='flex flex-col gap-3'>
      {[0, 1, 2].map((index) => (
        <div key={index} className='flex items-center justify-between gap-4'>
          <Skeleton className={index === 2 ? 'w-32' : 'w-24'} />
          <Skeleton className='w-24' />
        </div>
      ))}
    </div>
  </LoadingSkeleton>
)
