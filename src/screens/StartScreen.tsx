import { ArrowLeft, BookOpen, Briefcase, Crown, Sprout, Target, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { CONFIG, type TierId } from '../config'
import { fill, money } from '../engine/format'
import HowToPlay from '../components/HowToPlay'

const TIER_ICONS: Record<TierId, LucideIcon> = { startup: Sprout, middle: Briefcase, heir: Crown }
// Chiều cao khối minh họa quy mô vốn (không theo tỷ lệ thật).
const TIER_BLOCKS: Record<TierId, number> = { startup: 1, middle: 4, heir: 10 }

export default function StartScreen({ onStart, onBack }: { onStart: (tierId: TierId) => void; onBack: () => void }) {
  const t = CONFIG.text
  const defaultRef = useRef<HTMLButtonElement>(null)
  const [showHelp, setShowHelp] = useState(false)
  useEffect(() => {
    if (!showHelp) defaultRef.current?.focus()
  }, [showHelp])
  useEffect(() => {
    if (!showHelp) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowHelp(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showHelp])

  return (
    <div className="flex h-full animate-fade flex-col px-12 py-7">
      <header className="flex items-start justify-between gap-8">
        <div>
          <button onClick={onBack} className="mb-4 flex items-center gap-2 text-[17px] font-black text-mute hover:text-red">
            <ArrowLeft size={22} strokeWidth={3} />
            {t.selectBack}
          </button>
          <p className="text-[15px] font-black tracking-[0.2em] text-red">{t.selectEyebrow}</p>
          <h1 className="mt-1 text-[56px] leading-none font-black tracking-tight">{t.startChoose}</h1>
          <p className="mt-3 max-w-[700px] text-[19px] leading-snug">{t.selectHint}</p>
        </div>
        <div className="flex w-[380px] shrink-0 flex-col items-end gap-3">
          <button
            onClick={() => setShowHelp(true)}
            className="btn flex items-center gap-2 border-[3px] border-ink bg-amber px-4 py-3 text-[17px] font-black"
          >
            <BookOpen size={20} strokeWidth={2.5} />
            {t.help.open}
          </button>
          <p className="text-right text-[16px] leading-snug text-mute">{t.startHint}</p>
        </div>
      </header>

      <div className="mt-6 grid min-h-0 flex-1 grid-cols-3 gap-6">
        {CONFIG.tiers.map((tier) => {
          const Icon = TIER_ICONS[tier.id]
          return (
            <button
              key={tier.id}
              ref={tier.id === 'heir' ? defaultRef : undefined}
              onClick={() => onStart(tier.id)}
              className="btn group flex flex-col border-[3px] border-ink bg-card p-6 text-left"
            >
              <div className="flex w-full items-start justify-between">
                <div className="flex items-center gap-3">
                  <Icon size={36} strokeWidth={2.5} />
                  <span className="text-[28px] font-black">{tier.name}</span>
                </div>
                <span className="border-2 border-ink bg-ink px-3 py-1 text-[18px] font-bold text-card">
                  {tier.difficulty}
                </span>
              </div>

              <div className="mt-5 text-[58px] leading-none font-black">{money(tier.capital)}</div>
              {/* Dải khối: quy mô vốn tương đối giữa ba mức */}
              <div className="mt-4 flex w-full gap-[5px]" aria-hidden>
                {Array.from({ length: 10 }, (_, i) => (
                  <span key={i} className={`h-[14px] flex-1 ${i < TIER_BLOCKS[tier.id] ? 'bg-teal group-hover:bg-red' : 'bg-ink/10'}`} />
                ))}
              </div>

              <p className="mt-5 text-[20px] leading-snug text-mute">{tier.blurb}</p>

              <div className="mt-auto flex w-full items-center gap-3 border-t-[3px] border-ink pt-4">
                <Target size={28} strokeWidth={2.5} className="shrink-0 text-red" />
                <span className="text-[18px] leading-tight">
                  {t.startGoal}
                  <br />
                  <b className="text-[28px] font-black">{money(tier.target)}</b>
                  <span className="block text-[15px] leading-tight text-mute">
                    {fill(t.consumerGoal, { required: CONFIG.consumerNeed.requiredSatisfaction })}
                  </span>
                </span>
              </div>
            </button>
          )
        })}
      </div>
      {showHelp && <HowToPlay onClose={() => setShowHelp(false)} />}
    </div>
  )
}
