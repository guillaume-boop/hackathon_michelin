interface StarsProps {
  count: number
  green?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg'
  variant?: 'inline' | 'overlay'
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
          // eslint-disable-next-line @next/next/no-img-element
          <img key={`red-${i}`} src="/icons/etoile-michelin.svg" alt="★" width={dimSize} height={dimSize} style={{ filter: 'drop-shadow(0 1px 0px #000) drop-shadow(0 2px 6px rgba(0,0,0,0.9)) drop-shadow(0 0 12px rgba(0,0,0,0.7))' }} />
        ))}
        {green && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/icons/etoile-michelin.svg" alt="🌿" width={dimSize} height={dimSize} style={{ filter: 'hue-rotate(120deg) brightness(1.2) drop-shadow(0 1px 0px #000) drop-shadow(0 2px 6px rgba(0,0,0,0.9)) drop-shadow(0 0 12px rgba(0,0,0,0.7))' }} />
        )}
      </div>
    )
  }

  // inline — petites étoiles dans le texte
  return (
    <span className="inline-flex items-center gap-px">
      {Array.from({ length: count }).map((_, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={`in-${i}`} src="/icons/etoile-michelin.svg" alt="★" width={12} height={12} className="inline" />
      ))}
      {green && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/icons/etoile-michelin.svg" alt="🌿" width={12} height={12} className="inline opacity-60" style={{ filter: 'hue-rotate(120deg)' }} />
      )}
    </span>
  )
}
