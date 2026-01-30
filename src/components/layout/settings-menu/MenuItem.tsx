import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface MenuItemProps {
  icon: ReactNode
  title: string
  description?: string
  onClick?: () => void
  iconBgClass?: string
  rightElement?: ReactNode
}

export function MenuItem({
  icon,
  title,
  description,
  onClick,
  iconBgClass = 'bg-border/50',
  rightElement,
}: MenuItemProps) {
  const content = (
    <>
      <div className={clsx('p-2.5 rounded-xl', iconBgClass)}>{icon}</div>
      <div className="flex-1 text-left">
        <p className="font-medium text-foreground">{title}</p>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      {rightElement}
    </>
  )

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-border/30 transition-colors touch-feedback"
      >
        {content}
      </button>
    )
  }

  return <div className="flex items-center gap-4 px-4 py-4 rounded-xl">{content}</div>
}
