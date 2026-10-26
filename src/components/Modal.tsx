import { X } from 'lucide-react'
import { useRef, type ReactNode } from 'react'
import useFocusNav from './useFocusNav'

interface Props {
  children: ReactNode
  width: number
  shake?: boolean
  onClose?: () => void
  closeLabel?: string
  closeAriaLabel?: string
}

// Popup phủ lên màn chơi. Tự đưa tiêu điểm vào nút đầu tiên, chọn bằng phím mũi tên và Enter.
export default function Modal({
  children,
  width,
  shake = false,
  onClose,
  closeLabel = 'Đóng',
  closeAriaLabel = 'Đóng bảng thông tin',
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  useFocusNav(ref)

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink/70 animate-fade">
      <div className={shake ? 'animate-shake' : ''}>
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          className="animate-pop max-h-[calc(100%-32px)] overflow-y-auto border-[3px] border-ink bg-card p-7 shadow-hard"
          style={{ width: `min(${width}px, calc(100% - 32px))` }}
        >
          {onClose && (
            <div className="mb-3 flex justify-end">
              <button
                onClick={onClose}
                aria-label={closeAriaLabel}
                title={closeLabel}
                className="btn flex items-center gap-2 border-[3px] border-ink bg-amber px-3 py-2 text-[15px] font-black"
              >
                {closeLabel}
                <X size={18} strokeWidth={3} />
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}
