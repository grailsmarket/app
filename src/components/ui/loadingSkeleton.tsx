import type { ReactNode } from 'react'
import { DEFAULT_LOADING_GRADIENT } from 'ethereum-identity-kit'
import { cn } from '@/utils/tailwind'

interface SkeletonProps {
  className?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <span aria-hidden='true' className={cn('inline-block h-4 w-full overflow-hidden rounded-sm align-middle', className)}>
    <span
      className='loading-cell block motion-reduce:animate-none!'
      style={{ backgroundImage: DEFAULT_LOADING_GRADIENT }}
    />
  </span>
)

interface SkeletonTextProps extends SkeletonProps {
  label: string
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({ label, className }) => (
  <span role='status' className={cn('inline-flex max-w-full items-center align-middle', className)}>
    <span className='sr-only'>{label}</span>
    <Skeleton />
  </span>
)

interface LoadingSkeletonProps extends SkeletonTextProps {
  children: ReactNode
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ label, className, children }) => (
  <div role='status' className={className}>
    <span className='sr-only'>{label}</span>
    <div aria-hidden='true'>{children}</div>
  </div>
)

export default LoadingSkeleton
