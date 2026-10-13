import { useRef, type ReactNode } from 'react'
import useFocusNav from './useFocusNav'

interface Props {
  children: ReactNode
  width: number
  shake?: boolean
}

// Popup phủ lên màn chơi. Tự đưa tiêu điểm vào nút đầu tiên, chọn bằng phím mũi tên và Enter.
export default function Modal({ children, width, shake = false }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  useFocusNav(ref)

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink/70 animate-fade">
      <div className={shake ? 'animate-shake' : ''}>
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          className="animate-pop border-[3px] border-ink bg-card p-7 shadow-hard"
          style={{ width }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
