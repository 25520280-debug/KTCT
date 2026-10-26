import { BarChart3, Home, RotateCcw, Skull, Target, TriangleAlert, Trophy } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CONFIG } from '../config'
import AnimatedNumber from '../components/AnimatedNumber'
import VictoryEffects from '../components/VictoryEffects'
import { analyze } from '../engine/analysis'
import { consumerSatisfaction, target, totalCapital } from '../engine/engine'
import { money } from '../engine/format'
import type { GameState } from '../engine/types'

interface Props {
  game: GameState
  onReplay: () => void
  onHome: () => void
}

export default function EndScreen({ game, onReplay, onHome }: Props) {
  const t = CONFIG.text.end
  const analysis = useMemo(() => analyze(game), [game])
  const won = game.outcome === 'win'
  const h = game.history
  const surplus = h.turns.reduce((sum, turn) => sum + Math.max(0, turn.m), 0)
  const capital = totalCapital(game)
  const goal = target(game)
  const satisfaction = consumerSatisfaction(game)
  const allocated = h.reinvested + h.consumed
  const reinvestShare = allocated > 0 ? h.reinvested / allocated : 0
  const consumeShare = allocated > 0 ? h.consumed / allocated : 0
  const replayRef = useRef<HTMLButtonElement>(null)
  const [showAnalysis, setShowAnalysis] = useState(false)
  useEffect(() => replayRef.current?.focus(), [])

  const stats = [
    { label: t.statCapital, value: capital, format: money },
    { label: t.statSurplus, value: surplus, format: money },
    { label: t.statReinvest, value: h.reinvested, format: money },
    {
      label: CONFIG.text.result.consumerStat,
      value: satisfaction,
      format: (value: number) => `${Math.round(value)}%`,
    },
  ]

  return (
    <div className="relative isolate flex h-full flex-col overflow-y-auto px-6 py-4">
      <VictoryEffects won={won} />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <header className={`flex items-center gap-4 border-[3px] border-ink px-4 py-3 text-card ${won ? 'bg-teal' : 'stripes animate-shake bg-red'}`}>
          {won ? (
            <Trophy size={42} strokeWidth={2.2} className="shrink-0" />
          ) : (
            <span className="flex shrink-0 items-center gap-2">
              <Skull size={42} strokeWidth={2.5} />
              <TriangleAlert size={32} strokeWidth={2.8} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-[28px] leading-tight font-black">{won ? t.winTitle : t.loseTitle}</h1>
            <p className="mt-1 text-[16px] leading-snug">{analysis.verdict}</p>
          </div>
          <button
            ref={replayRef}
            onClick={onReplay}
            className="btn flex shrink-0 items-center gap-2 border-[3px] border-ink bg-card px-4 py-2 text-[17px] font-black text-ink"
          >
            <RotateCcw size={21} strokeWidth={3} />
            {t.replay}
          </button>
          <button
            onClick={onHome}
            aria-label="Về màn hình chính"
            title="Về màn hình chính"
            className="btn flex size-11 shrink-0 items-center justify-center border-[3px] border-ink bg-card text-ink"
          >
            <Home size={21} strokeWidth={2.5} />
          </button>
        </header>

        <div className="mt-3 grid grid-cols-4 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="min-w-0 border-[3px] border-ink bg-card px-3 py-2">
              <div className="text-[14px] leading-tight font-bold text-mute">{stat.label}</div>
              <AnimatedNumber value={stat.value} from={0} format={stat.format} className="block truncate text-[23px] leading-tight font-black" />
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <section className="border-[3px] border-ink bg-card px-4 py-3">
            <h2 className="flex items-center gap-2 text-[17px] leading-tight font-black">
              <Target size={20} strokeWidth={2.8} className="text-red" />
              TIẾN ĐỘ MỤC TIÊU
            </h2>
            <div className="mt-3">
              <div className="flex items-baseline justify-between gap-2 text-[14px]">
                <span className="font-bold">Tổng tư bản</span>
                <span className="font-black">{money(capital)} / {money(goal)}</span>
              </div>
              <div
                role="progressbar"
                aria-label="Tiến độ mục tiêu tư bản"
                aria-valuenow={Math.min(100, goal > 0 ? (capital / goal) * 100 : 0)}
                aria-valuemin={0}
                aria-valuemax={100}
                className="mt-1 h-4 border-2 border-ink bg-paper"
              >
                <div
                  className="h-full bg-teal"
                  style={{ width: `${Math.min(100, goal > 0 ? (capital / goal) * 100 : 0)}%` }}
                />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline justify-between gap-2 text-[14px]">
                <span className="font-bold">Thỏa mãn tiêu dùng</span>
                <span className="font-black">{Math.round(satisfaction)}% / {CONFIG.consumerNeed.requiredSatisfaction}%</span>
              </div>
              <div
                role="progressbar"
                aria-label="Mức thỏa mãn tiêu dùng"
                aria-valuenow={Math.min(100, satisfaction)}
                aria-valuemin={0}
                aria-valuemax={100}
                className="mt-1 h-4 border-2 border-ink bg-paper"
              >
                <div
                  className={satisfaction >= CONFIG.consumerNeed.requiredSatisfaction ? 'h-full bg-teal' : 'h-full bg-amber'}
                  style={{ width: `${Math.min(100, satisfaction)}%` }}
                />
              </div>
            </div>
          </section>

          <section className="border-[3px] border-ink bg-card px-4 py-3">
            <h2 className="flex items-center gap-2 text-[17px] leading-tight font-black">
              <BarChart3 size={20} strokeWidth={2.8} className="text-teal" />
              PHÂN BỔ GIÁ TRỊ THẶNG DƯ
            </h2>
            <div className="mt-3 flex h-6 overflow-hidden border-2 border-ink bg-paper" aria-label="Tỷ lệ tái đầu tư và tiêu dùng">
              <div className="h-full bg-teal" style={{ width: `${reinvestShare * 100}%` }} />
              <div className="h-full bg-amber" style={{ width: `${consumeShare * 100}%` }} />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3 text-[14px]">
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-bold"><span className="size-3 shrink-0 bg-teal" /> Tái đầu tư</div>
                <div className="truncate pl-5 font-black">{money(h.reinvested)} · {Math.round(reinvestShare * 100)}%</div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-bold"><span className="size-3 shrink-0 bg-amber" /> Tiêu dùng</div>
                <div className="truncate pl-5 font-black">{money(h.consumed)} · {Math.round(consumeShare * 100)}%</div>
              </div>
            </div>
            <p className="mt-2 text-[13px] leading-tight text-mute">
              Tăng ca {h.overtimeCount} lần · Đình công {h.strikes} lần
            </p>
          </section>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={() => setShowAnalysis((visible) => !visible)}
            aria-expanded={showAnalysis}
            className="btn flex items-center gap-2 border-[3px] border-ink bg-amber px-4 py-2 text-[15px] font-black"
          >
            <BarChart3 size={18} strokeWidth={2.5} />
            {showAnalysis ? 'ẨN PHÂN TÍCH' : 'XEM PHÂN TÍCH CHI TIẾT'}
          </button>
          {!showAnalysis && <span className="text-[14px] text-mute">Ba góc nhìn về chiến lược và kết quả.</span>}
        </div>

        {showAnalysis && (
          <div className="mt-3 grid min-h-0 flex-1 grid-cols-3 gap-3">
            {analysis.groups.map((group) => (
              <section key={group.title} className="min-h-0 overflow-y-auto border-[3px] border-ink bg-card px-4 py-3">
                <h2 className="border-b-[3px] border-ink pb-2 text-[16px] leading-tight font-black">{group.title}</h2>
                {group.items.map((item) => (
                  <p key={item.text} className="mt-2 text-[14px] leading-snug">
                    {item.label && <b className="font-black text-red">{item.label}: </b>}
                    {item.text}
                  </p>
                ))}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
