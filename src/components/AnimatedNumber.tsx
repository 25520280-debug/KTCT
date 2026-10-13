import { useEffect, useRef, useState } from 'react'

const DURATION = 450
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface Props {
  value: number
  format: (value: number) => string
  className?: string
  from?: number // giá trị bắt đầu đếm khi vừa hiện ra
}

// Số nhảy mượt tới giá trị mới rồi dừng hẳn.
export default function AnimatedNumber({ value, format, className, from: initial = value }: Props) {
  const [shown, setShown] = useState(initial)
  const shownRef = useRef(initial)

  useEffect(() => {
    const from = shownRef.current
    if (from === value) return
    if (reducedMotion()) {
      shownRef.current = value
      setShown(value)
      return
    }
    const startedAt = performance.now()
    let frame = requestAnimationFrame(function tick(now) {
      const t = Math.min(1, (now - startedAt) / DURATION)
      shownRef.current = from + (value - from) * easeOutCubic(t)
      setShown(shownRef.current)
      if (t < 1) frame = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [value])

  return <span className={className}>{format(shown)}</span>
}
