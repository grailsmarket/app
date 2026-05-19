interface ReplyArrowIconProps {
  height?: number
  width?: number
  className?: string
  strokeWidth?: number
}

const ReplyArrowIcon = ({ height = 16, width = 16, className, strokeWidth = 2 }: ReplyArrowIconProps) => (
  <svg width={width} height={height} viewBox='0 0 24 24' fill='none' aria-hidden='true' className={className}>
    <path
      d='M9 17L4 12L9 7'
      stroke='currentColor'
      strokeWidth={strokeWidth}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M20 18V16C20 13.7909 18.2091 12 16 12H4'
      stroke='currentColor'
      strokeWidth={strokeWidth}
      strokeLinecap='round'
    />
  </svg>
)

export default ReplyArrowIcon
