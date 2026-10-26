import { useEffect, useState, type ReactNode } from 'react'

export const STAGE_WIDTH = 1280
export const STAGE_HEIGHT = 720

const viewportSize = () => ({
  width: window.visualViewport?.width ?? window.innerWidth,
  height: window.visualViewport?.height ?? window.innerHeight,
})

const fitScale = () => {
  const { width, height } = viewportSize()
  return Math.min(width / STAGE_WIDTH, height / STAGE_HEIGHT)
}

// Khung tọa độ cố định để cảnh Phaser và giao diện luôn co giãn cùng một tỷ lệ.
export default function Stage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(fitScale)

  useEffect(() => {
    const onResize = () => setScale(fitScale())
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    window.visualViewport?.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
      window.visualViewport?.removeEventListener('resize', onResize)
    }
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
