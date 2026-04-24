interface StarsProps {
  count: number
  green?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg'
  variant?: 'inline' | 'overlay'
}

function StarIcon({ size = 18, isGreen = false }: { size?: number; isGreen?: boolean }) {
  const filterColor = isGreen ? 'brightness(0) saturate(100%) invert(40%) sepia(80%) saturate(600%) hue-rotate(100deg) brightness(70%) contrast(110%)' : 'none'
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/etoile-michelin.svg"
      alt="★"
      width={size}
      height={size}
      style={{ flexShrink: 0, filter: filterColor }}
    />
  )
}

export default function Stars({ count, green = false, size = 'sm', variant = 'inline' }: StarsProps) {
  if (count === 0 && !green) return null

  const sizeMap = { xs: 14, sm: 18, md: 24, lg: 32 }
  const dimSize = sizeMap[size]
  const gap = { xs: 'gap-0.5', sm: 'gap-1', md: 'gap-1.5', lg: 'gap-2' }[size]

  if (variant === 'overlay') {
    return (
      <div className={`flex items-center ${gap}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={`red-${i}`} style={{ filter: 'drop-shadow(0 1px 0px #000) drop-shadow(0 2px 6px rgba(0,0,0,0.9)) drop-shadow(0 0 12px rgba(0,0,0,0.7))' }}>
            <StarIcon size={dimSize} />
          </div>
        ))}
        {green && (
          <div style={{ filter: 'drop-shadow(0 1px 0px #000) drop-shadow(0 2px 6px rgba(0,0,0,0.9)) drop-shadow(0 0 12px rgba(0,0,0,0.7))' }}>
            <StarIcon size={dimSize} isGreen />
          </div>
        )}
      </div>
    )
  }

  // inline
  return (
    <span className={`inline-flex items-center ${gap}`}>
      {Array.from({ length: count }).map((_, i) => (
        <StarIcon key={`in-${i}`} size={dimSize} />
      ))}
      {green && <StarIcon size={dimSize} isGreen />}
    </span>
  )
}
