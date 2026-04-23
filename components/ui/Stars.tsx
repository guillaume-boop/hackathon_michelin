interface StarsProps {
  count: number
  green?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg'
  variant?: 'inline' | 'overlay'
}

function StarSVG({ size = 18, color = '#E4002B' }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color} style={{ flexShrink: 0 }}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function GreenStarSVG({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="#22c55e" style={{ flexShrink: 0 }}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
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
