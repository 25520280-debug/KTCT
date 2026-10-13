import { useEffect, useState, type ReactNode } from 'react'

export const STAGE_WIDTH = 1280
export const STAGE_HEIGHT = 720

const fitScale = () => Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT)

// Khung thiết kế cố định 1280x720, co giãn đều để vừa mọi máy chiếu.
export default function Stage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(fitScale)

  useEffect(() => {
    const onResize = () => setScale(fitScale())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden bg-ink">
      <div
        className="relative shrink-0 overflow-hidden bg-paper"
        style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  )
}
