'use client'

import type React from 'react'

const MAX_SCORE = 300

const SPARKS = [
  { left: '12%', delay: '0s',    size: 8,  color: 'white'   },
  { left: '25%', delay: '0.5s',  size: 6,  color: '#ffb3d9' },
  { left: '38%', delay: '1.0s',  size: 9,  color: 'white'   },
  { left: '52%', delay: '0.25s', size: 7,  color: '#ffb3d9' },
  { left: '65%', delay: '0.75s', size: 8,  color: 'white'   },
  { left: '78%', delay: '0.4s',  size: 6,  color: '#ffb3d9' },
  { left: '88%', delay: '1.2s',  size: 9,  color: 'white'   },
]

export default function CircleScore({ score }: { score: number }) {
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
          0%   { opacity: 0;   transform: translateX(-50%) translateY(0px)   scale(0.4); }
          25%  { opacity: 1;   transform: translateX(-50%) translateY(-10px)  scale(1);   }
          75%  { opacity: 0.8; transform: translateX(-50%) translateY(-22px)  scale(0.8); }
          100% { opacity: 0;   transform: translateX(-50%) translateY(-32px)  scale(0.3); }
        }
        .bar-shimmer { animation: bar-shimmer var(--shimmer-duration, 1.8s) linear infinite; }
        .icon-spin   { animation: icon-spin 2.4s linear infinite; }
        .cs-spark    { animation: spark-rise 1.6s ease-out infinite; position: absolute; pointer-events: none; line-height: 1; }
      `}</style>

      {/* Conteneur avec espace au-dessus pour les étincelles */}
      <div style={{ position: 'relative' }}>

        {/* Étincelles positionnées au bord supérieur de la barre */}
        {SPARKS.map((sp, i) => (
          <span
            key={i}
            className="cs-spark"
            style={{
              left: sp.left,
              bottom: 0,
              fontSize: sp.size,
              color: sp.color,
              animationDelay: sp.delay,
              zIndex: 10,
            }}
          >
            ✦
          </span>
        ))}

        {/* Barre dégradée */}
        <div style={{ position: 'relative', height: 48, borderRadius: 999, overflow: 'hidden', marginLeft: 8, marginRight: 8 }}>
          <div
            style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, #D30792 0%, #D3072C 100%)',
            }}
          />
          <div
            className="bar-shimmer"
            style={{
              position: 'absolute', top: 0, bottom: 0, width: '25%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            }}
          />

          {/* Label à gauche */}
          <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 14, lineHeight: 1 }}>Score total :</span>
          </div>

          {/* Score + icône à droite */}
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: 14, lineHeight: 1 }}>{score}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/etoile-michelin.svg"
              alt=""
              className="icon-spin"
              style={{ width: 24, height: 24, filter: 'brightness(0) invert(1) drop-shadow(0 0 4px rgba(255,255,255,0.6))' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
