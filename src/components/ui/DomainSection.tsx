import { clsx } from 'clsx'

interface DomainSectionProps {
  /** The domain(s) this section represents */
  domain: string | string[]
  /** Currently selected domain (null = no selection) */
  selectedDomain: string | null
  children: React.ReactNode
}

export function DomainSection({ domain, selectedDomain, children }: DomainSectionProps) {
  const domains = Array.isArray(domain) ? domain : [domain]
  const isActive = domains.some((d) => d === selectedDomain)
  const isOtherActive = selectedDomain !== null && !isActive

  return (
    <div
      className={clsx(
        'transition-opacity duration-200 relative',
        isOtherActive && 'opacity-50',
        isActive && 'z-20'
      )}
    >
      {children}
    </div>
  )
}
