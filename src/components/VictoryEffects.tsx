import type { CSSProperties } from 'react'

const bursts = [
  { x: 12, y: 18, delay: 0 },
  { x: 88, y: 20, delay: 140 },
  { x: 10, y: 80, delay: 360 },
  { x: 90, y: 78, delay: 520 },
  { x: 50, y: 12, delay: 760 },
]
const colors = ['#ffcc00', '#ff3b30', '#00d9ff', '#ff39c8', '#7cff00', '#fff8dc', '#7b3cff']
const sparkles = [
  [5, 38], [15, 61], [24, 12], [34, 88], [43, 24], [55, 67], [65, 10], [76, 47],
  [95, 38], [8, 92], [28, 52], [39, 6], [61, 91], [72, 77], [83, 35], [93, 60],
  [18, 30], [48, 82], [69, 28], [31, 72], [57, 43], [87, 91],
]

export default function VictoryEffects({ won }: { won: boolean }) {
  return (
    <div className={`pointer-events-none absolute inset-0 z-20 overflow-hidden ${won ? '' : 'failure-atmosphere'}`} aria-hidden="true">
      <div className={`${won ? 'victory-edge-glow' : 'failure-edge-warning'} absolute inset-2 rounded-xl`} />
      {won ? (
        <>
          {bursts.map((burst, burstIndex) => (
            <div
              key={`burst-${burst.x}-${burst.y}`}
              className="firework-burst absolute"
              style={{ left: `${burst.x}%`, top: `${burst.y}%` }}
            >
              <span className="firework-flash absolute" style={{ animationDelay: `${burst.delay}ms` }} />
              <span className="firework-ring absolute" style={{ animationDelay: `${burst.delay}ms` }} />
              {Array.from({ length: 24 }, (_, index) => {
                const angle = (Math.PI * 2 * index) / 24 + burstIndex * 0.13
                const distance = 54 + ((index * 17 + burstIndex * 11) % 70)
                const style = {
                  '--spark-x': `${Math.cos(angle) * distance}px`,
                  '--spark-y': `${Math.sin(angle) * distance}px`,
                  '--spark-angle': `${(angle * 180) / Math.PI + 90}deg`,
                  '--spark-color': colors[(index + burstIndex) % colors.length],
                  animationDelay: `${burst.delay}ms`,
                } as CSSProperties
                return <span key={index} className="firework-particle absolute" style={style} />
              })}
            </div>
          ))}
          {sparkles.map(([x, y], index) => (
            <span
              key={`glitter-${x}-${y}`}
              className="victory-glitter absolute"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                '--glitter-delay': `${2.8 + (index % 8) * 0.23}s`,
                '--glitter-duration': `${1.5 + (index % 5) * 0.3}s`,
              } as CSSProperties}
            />
          ))}
        </>
      ) : (
        <>
          <div className="failure-stripe failure-stripe-top absolute" />
          <div className="failure-stripe failure-stripe-bottom absolute" />
        </>
      )}
    </div>
  )
}
