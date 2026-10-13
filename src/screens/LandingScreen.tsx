import { Play } from 'lucide-react'
import { useEffect, useRef } from 'react'

export default function LandingScreen({ onPlay }: { onPlay: () => void }) {
  const playRef = useRef<HTMLButtonElement>(null)
  useEffect(() => playRef.current?.focus(), [])

  return (
    <div className="relative h-full overflow-hidden bg-[#fff9df] text-ink">
      <img
        src={`${import.meta.env.BASE_URL}assets/splash-background.png`}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute left-[28px] top-1/2 w-[218px] -translate-y-1/2">
        <button
          ref={playRef}
          onClick={onPlay}
          className="btn flex w-full items-center justify-center gap-3 border-[4px] border-ink bg-amber px-3 py-4 text-[23px] font-black text-ink shadow-[5px_5px_0_#17171c]"
        >
          <Play size={24} fill="currentColor" />
          CHƠI NGAY
        </button>
      </div>
    </div>
  )
}
