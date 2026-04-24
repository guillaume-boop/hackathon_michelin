'use client'

const FILTERS = [
  { label: 'Tout', value: null },
  { label: '★ 1 étoile', value: 1 },
  { label: '★★ 2 étoiles', value: 2 },
  { label: '★★★ 3 étoiles', value: 3 },
  { label: '🌿 Vert', value: -1 },
]

interface FilterChipsProps {
  active: number | null
  onChange: (value: number | null) => void
}

export default function FilterChips({ active, onChange }: FilterChipsProps) {
  return (
    <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
      {FILTERS.map(({ label, value }) => {
        const isActive = active === value
        return (
          <button
            key={String(value)}
            onClick={() => onChange(isActive ? null : value)}
            className={`
              flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-semibold
              transition-all duration-150 active:scale-95
              ${isActive
                ? 'bg-white text-black'
                : 'bg-black/50 backdrop-blur-md text-white/80 border border-white/20'
              }
            `}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
