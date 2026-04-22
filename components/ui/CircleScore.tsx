'use client'

import type React from 'react'

const MAX_SCORE = 300

const LEVELS = [
  { min: 200, label: 'Grand Gourmet' },
  { min: 100, label: 'Gourmet' },
  { min: 50,  label: 'Gastronome' },
  { min: 20,  label: 'Amateur éclairé' },
  { min: 0,   label: 'Curieux' },
]

function getLevel(score: number) {
  return LEVELS.find(l => score >= l.min)?.label ?? 'Curieux'
}

// Étincelles réparties le long de la barre : left% + délai
const SPARKS = [
  { left: '15%', delay: '0s',    size: 7,  color: '#E4002B' },
  { left: '28%', delay: '0.4s',  size: 6,  color: 'white'   },
  { left: '42%', delay: '0.9s',  size: 8,  color: '#ff6b6b' },
  { left: '57%', delay: '0.2s',  size: 6,  color: '#E4002B' },
  { left: '70%', delay: '0.65s', size: 7,  color: 'white'   },
  { left: '83%', delay: '1.1s',  size: 5,  color: '#ff6b6b' },
  { left: '91%', delay: '0.35s', size: 8,  color: '#E4002B' },
]

export default function CircleScore({ score }: { score: number }) {
  const level = getLevel(score)
  // Plus le score est élevé, plus le shimmer va vite (3.5s → 0.5s)
  const shimmerDuration = Math.max(0.5, 3.5 - (Math.min(score, MAX_SCORE) / MAX_SCORE) * 3).toFixed(2) + 's'

  return (
    <div className="w-full" style={{ '--shimmer-duration': shimmerDuration } as React.CSSProperties}>
      <style>{`
        @keyframes bar-shimmer {
          0%   { transform: translateX(-120%); }
          100% { transform: translateX(350%); }
        }
        @keyframes icon-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes spark-rise {
          0%   { opacity: 0; transform: translateX(-50%) translateY(-50%) scale(0); }
          20%  { opacity: 1; transform: translateX(-50%) translateY(calc(-50% - 6px)) scale(1); }
          70%  { opacity: 1; transform: translateX(-50%) translateY(calc(-50% - 14px)) scale(0.8); }
          100% { opacity: 0; transform: translateX(-50%) translateY(calc(-50% - 20px)) scale(0); }
        }
        .bar-shimmer { animation: bar-shimmer var(--shimmer-duration, 1.8s) linear infinite; }
        .icon-spin   { animation: icon-spin 2.4s linear infinite; }
        .spark       { animation: spark-rise 1.4s ease-in-out infinite; }
      `}</style>

      {/* Label au-dessus */}
      <div className="mb-2 px-0.5">
        <span className="text-white font-bold text-sm">Votre score :</span>
      </div>

      {/* Barre complète avec icône dedans */}
      <div className="relative">

        {/* Étincelles au-dessus */}
        {SPARKS.map((sp, i) => (
          <span
            key={i}
            className="spark absolute pointer-events-none z-10"
            style={{
              left: sp.left,
              top: '50%',
              fontSize: sp.size,
              color: sp.color,
              animationDelay: sp.delay,
              lineHeight: 1,
            }}
          >
            ✦
          </span>
        ))}

        {/* Barre dégradée */}
        <div className="h-8 rounded-2xl bg-white/[0.06] overflow-hidden relative">
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(90deg, rgba(228,0,43,0.1) 0%, rgba(228,0,43,0.5) 60%, #E4002B 100%)' }}
          />
          <div
            className="bar-shimmer absolute inset-y-0 w-1/4"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)' }}
          />
        </div>

        {/* Score à droite dans la barre, avant l'icône */}
        <div className="absolute right-9 top-1/2 -translate-y-1/2 z-20">
          <span className="text-white font-black text-sm leading-none tabular-nums">{score}</span>
        </div>

        {/* Icône à droite dans la barre */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center z-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/etoile-michelin.svg"
            alt=""
            className="icon-spin w-6 h-6"
            style={{ filter: 'brightness(0) invert(1) drop-shadow(0 0 4px rgba(255,255,255,0.6))' }}
          />
        </div>

      </div>
    </div>
  )
}
