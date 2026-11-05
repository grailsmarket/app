import React from 'react'

type IconProps = React.SVGProps<SVGSVGElement>

// Line glyphs for the modal system, drawn in currentColor. Info, alert and external-link
// come from public/icons; wallet and search were drawn to match them.

const LineIcon: React.FC<IconProps> = ({ viewBox = '0 0 24 24', strokeWidth = 1.75, children, ...props }) => (
  <svg
    viewBox={viewBox}
    fill='none'
    stroke='currentColor'
    strokeWidth={strokeWidth}
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
    focusable='false'
    {...props}
  >
    {children}
  </svg>
)

export const InfoIcon: React.FC<IconProps> = (props) => (
  <LineIcon viewBox='0 0 20 20' strokeWidth={1.35} {...props}>
    <path d='M9.6748 5.17578H9.68606M9.6748 8.17578L9.68606 14.1758M18.6748 9.67578C18.6748 14.6463 14.6454 18.6758 9.6748 18.6758C4.70424 18.6758 0.674805 14.6463 0.674805 9.67578C0.674805 4.70522 4.70424 0.675781 9.6748 0.675781C14.6454 0.675781 18.6748 4.70522 18.6748 9.67578Z' />
  </LineIcon>
)

export const AlertIcon: React.FC<IconProps> = (props) => (
  <LineIcon viewBox='0 0 20 20' strokeWidth={1.35} {...props}>
    <path d='M9.6748 5.17578V10.8008M9.6748 14.1758H9.68606M18.6748 9.67578C18.6748 14.6463 14.6454 18.6758 9.6748 18.6758C4.70424 18.6758 0.674805 14.6463 0.674805 9.67578C0.674805 4.70522 4.70424 0.675781 9.6748 0.675781C14.6454 0.675781 18.6748 4.70522 18.6748 9.67578Z' />
  </LineIcon>
)

export const ExternalLinkIcon: React.FC<IconProps> = (props) => (
  <LineIcon strokeWidth={2} {...props}>
    <path d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' />
    <polyline points='15 3 21 3 21 9' />
    <line x1='10' y1='14' x2='21' y2='3' />
  </LineIcon>
)

export const WalletIcon: React.FC<IconProps> = (props) => (
  <LineIcon {...props}>
    <path d='M18.5 8V6.5A1.5 1.5 0 0 0 17 5H5.5A1.5 1.5 0 0 0 4 6.5v11A1.5 1.5 0 0 0 5.5 19h12a1.5 1.5 0 0 0 1.5-1.5V15' />
    <path d='M15 9.5h5.25a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-.75.75H15a2.5 2.5 0 0 1 0-5Z' />
    <circle cx='15.25' cy='12' r='0.6' fill='currentColor' />
  </LineIcon>
)

export const SearchIcon: React.FC<IconProps> = (props) => (
  <LineIcon {...props}>
    <circle cx='11' cy='11' r='6' />
    <path d='M15.5 15.5L20 20' />
  </LineIcon>
)

export const BangIcon: React.FC<IconProps> = (props) => (
  <LineIcon strokeWidth={2.5} {...props}>
    <path d='M12 6.5v7M12 17.5h.01' />
  </LineIcon>
)

export const EthIcon: React.FC<IconProps> = (props) => (
  <svg viewBox='0 -1 11 19' fill='currentColor' aria-hidden='true' focusable='false' {...props}>
    <path d='M0 9.21289L5.35156 0.306641L10.6641 9.21289L5.35156 12.4551L0 9.21289Z' />
    <path d='M5.35156 13.4316L0 10.1895L5.35156 17.7285L10.6641 10.1895L5.35156 13.4316Z' />
  </svg>
)

export const MinimizeIcon: React.FC<IconProps> = (props) => (
  <LineIcon strokeWidth={2.25} {...props}>
    <path d='M6 17.5h12' />
  </LineIcon>
)

export const CalendarIcon: React.FC<IconProps> = (props) => (
  <LineIcon {...props}>
    <rect x='3.5' y='5' width='17' height='15.5' rx='2' />
    <path d='M8 3v4M16 3v4M3.5 10h17' />
  </LineIcon>
)

export const ChevronIcon: React.FC<IconProps> = (props) => (
  <LineIcon {...props}>
    <path d='M6 9l6 6 6-6' />
  </LineIcon>
)

export const MinusIcon: React.FC<IconProps> = (props) => (
  <LineIcon {...props}>
    <path d='M6 12h12' />
  </LineIcon>
)

export const PlusIcon: React.FC<IconProps> = (props) => (
  <LineIcon {...props}>
    <path d='M12 6v12M6 12h12' />
  </LineIcon>
)

export const SyncIcon: React.FC<IconProps> = (props) => (
  <LineIcon viewBox='0 0 20 20' strokeWidth={1.7} {...props}>
    <path d='M16.25 9.25C16.25 5.93629 13.5637 3.25 10.25 3.25C7.90709 3.25 5.8781 4.59285 4.8905 6.55' />
    <path d='M3.75 4.25V6.75H6.25' />
    <path d='M3.75 10.75C3.75 14.0637 6.43629 16.75 9.75 16.75C12.0929 16.75 14.1219 15.4071 15.1095 13.45' />
    <path d='M16.25 15.75V13.25H13.75' />
  </LineIcon>
)
