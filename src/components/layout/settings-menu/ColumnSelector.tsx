import { clsx } from 'clsx'

interface ColumnSelectorProps {
  value: 1 | 2 | 3
  onChange: (value: 1 | 2 | 3) => void
}

export function ColumnSelector({ value, onChange }: ColumnSelectorProps) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-border">
      {([1, 2, 3] as const).map((col) => (
        <button
          key={col}
          onClick={() => onChange(col)}
          className={clsx(
            'w-8 h-7 text-sm font-medium transition-colors',
            value === col
              ? 'bg-accent text-white'
              : 'bg-transparent text-foreground hover:bg-border/50'
          )}
        >
          {col}
        </button>
      ))}
    </div>
  )
}
