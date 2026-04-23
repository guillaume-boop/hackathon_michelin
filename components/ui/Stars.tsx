interface StarsProps {
  count: number
  green?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg'
  variant?: 'inline' | 'overlay'
}

function StarSVG({ size = 18, color = '#E4002B' }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color} style={{ flexShrink: 0 }}>
      <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
    </svg>
  )
}

function GreenStarSVG({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="#22c55e" style={{ flexShrink: 0 }}>
      <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
    </svg>
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
            <StarSVG size={dimSize} />
          </div>
        ))}
        {green && (
          <div style={{ filter: 'drop-shadow(0 1px 0px #000) drop-shadow(0 2px 6px rgba(0,0,0,0.9)) drop-shadow(0 0 12px rgba(0,0,0,0.7))' }}>
            <GreenStarSVG size={dimSize} />
          </div>
        )}
      </div>
    )
  }

  // inline
  return (
    <span className={`inline-flex items-center ${gap}`}>
      {Array.from({ length: count }).map((_, i) => (
        <StarSVG key={`in-${i}`} size={dimSize} />
      ))}
      {green && <GreenStarSVG size={dimSize} />}
    </span>
  )
}
