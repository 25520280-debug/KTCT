import { useEffect, useRef } from 'react'
import { CONFIG } from '../config'
import MerchantSplash from './MerchantSplash'
import type { TutorialStep } from '../tutorial'
import type { ZoneId } from '../world/layout'

interface Props {
  step: Exclude<TutorialStep, 'done' | 'result'>
  near: ZoneId | null
  onContinue: () => void
}

export default function TutorialCoach({ step, near, onContinue }: Props) {
  const t = CONFIG.text.tutorial
  const buttonRef = useRef<HTMLButtonElement>(null)
  const isMachine = step === 'upgradeMachine'
  const isFactory = step === 'expandFactory'
  const isMechanic = isMachine || isFactory
  const isMovement = step === 'goHr' || step === 'goLever' || step === 'goSafe'
  const zone: ZoneId | null = step === 'goHr' ? 'hr' : step === 'goLever' ? 'lever' : step === 'goSafe' ? 'safe' : null
  const hint =
    step === 'goHr'
      ? { ...t.goHr, body: near === 'hr' ? t.goHr.near : t.goHr.move }
      : step === 'hire'
        ? t.hire
        : step === 'goLever'
          ? { ...t.goLever, body: near === 'lever' ? t.goLever.near : t.goLever.move }
          : step === 'produce'
            ? t.produce
            : step === 'goSafe'
              ? { ...t.goSafe, body: near === 'safe' ? t.goSafe.near : t.goSafe.move }
              : step === 'allocate'
                ? t.allocate
                : isMachine
                  ? t.upgradeMachine
                  : t.expandFactory

  useEffect(() => {
    buttonRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      onContinue()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onContinue])

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-ink/85 animate-fade">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
        className="flex w-[900px] items-stretch border-[4px] border-ink bg-paper shadow-hard"
      >
        <div className="flex w-[300px] shrink-0 flex-col items-center justify-end overflow-hidden border-r-[4px] border-ink bg-teal px-5 pt-5">
          <div className="mb-3 border-[3px] border-ink bg-amber px-4 py-2 text-[18px] font-black tracking-wide">
            NHÀ TƯ BẢN
          </div>
          <MerchantSplash className="h-[330px] w-[230px]" />
        </div>

        <div className="flex min-h-[430px] flex-1 flex-col p-7">
          <div className="flex items-center gap-3">
            <span className="border-[3px] border-ink bg-amber px-3 py-1 text-[17px] font-black">
              {isMechanic ? 'GIỚI THIỆU CÔNG CỤ' : `THAO TÁC ${step === 'goHr' || step === 'hire' ? '1' : step === 'goLever' || step === 'produce' ? '2' : '3'}`}
            </span>
            <span className="h-[3px] flex-1 bg-ink/20" />
            <span className="text-[16px] font-black tracking-[0.12em] text-red">HƯỚNG DẪN</span>
          </div>

          <h2 id="tutorial-title" className="mt-7 text-[32px] leading-tight font-black">
            {hint.title}
          </h2>
          <p className="mt-4 text-[20px] leading-relaxed">{hint.body}</p>

          {isMovement && (
            <div className="mt-5 flex items-center gap-3 border-l-[6px] border-red bg-card px-4 py-3 text-[17px] font-bold">
              <span className="border-2 border-ink bg-amber px-2 py-1">WASD / ↑ ↓ ← →</span>
              <span>di chuyển</span>
              <span className="border-2 border-ink bg-ink px-2 py-1 text-card">E</span>
              <span>tương tác</span>
            </div>
          )}
          {step === 'hire' && <p className="mt-4 border-l-[6px] border-amber bg-card px-4 py-3 text-[17px] leading-snug">{t.hire.menu}</p>}
          {step === 'produce' && <p className="mt-4 border-l-[6px] border-amber bg-card px-4 py-3 text-[17px] leading-snug">{t.produce.menu}</p>}
          {step === 'allocate' && <p className="mt-4 border-l-[6px] border-amber bg-card px-4 py-3 text-[17px] leading-snug">{t.allocate.menu}</p>}

          <div className="mt-auto flex items-end justify-between gap-4 pt-6">
            <p className="max-w-[300px] text-[15px] leading-snug text-mute">
              {zone ? 'Có thể nhấp vào sàn để tự tìm đường; không cần theo đường vẽ.' : 'Nhấn tiếp tục để thực hiện thao tác.'}
            </p>
            <button
              ref={buttonRef}
              onClick={onContinue}
              className="btn whitespace-nowrap border-[3px] border-ink bg-amber px-5 py-3 text-[18px] font-black"
            >
              Đã hiểu · Tiếp tục
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
