interface NavLinkProps {
  renderNotificationCircle: boolean
  isActive: boolean
  onClick: () => void
  label: string
}

const NavLink: React.FC<NavLinkProps> = ({
  renderNotificationCircle,
  isActive,
  onClick,
  label,
}) => {
  return (
    <button
      onClick={onClick}
      className={`${isActive ? 'text-light-800' : 'text-light-200'} relative`}
    >
      <p>{label}</p>
      {renderNotificationCircle && (
        <div className="absolute right-0 top-0 h-[5px] w-[5px]  translate-x-[5px] translate-y-1 rounded-full bg-[#FF8E75]" />
      )}
    </button>
  )
}

export default NavLink
