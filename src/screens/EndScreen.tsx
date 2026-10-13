import { Bot, RotateCcw, Skull, TriangleAlert, Trophy } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { CONFIG } from '../config'
import AnimatedNumber from '../components/AnimatedNumber'
import VictoryEffects from '../components/VictoryEffects'
import { analyze } from '../engine/analysis'
import { consumerSatisfaction, totalCapital } from '../engine/engine'
import { money } from '../engine/format'
import type { GameState } from '../engine/types'

interface Props {
  game: GameState
  onReplay: () => void
}

export default function EndScreen({ game, onReplay }: Props) {
  const t = CONFIG.text.end
  const analysis = useMemo(() => analyze(game), [game])
  const won = game.outcome === 'win'
  const h = game.history
  const surplus = h.turns.reduce((sum, turn) => sum + Math.max(0, turn.m), 0)
  const replayRef = useRef<HTMLButtonElement>(null)
  useEffect(() => replayRef.current?.focus(), [])

  const count = (value: number) => `${Math.round(value)} ${t.times}`
  const stats = [
    { label: t.statCapital, value: totalCapital(game), format: money },
    { label: t.statSurplus, value: surplus, format: money },
    { label: t.statReinvest, value: h.reinvested, format: money },
    { label: t.statConsume, value: h.consumed, format: money },
    {
      label: CONFIG.text.result.consumerStat,
      value: consumerSatisfaction(game),
      format: (value: number) => `${Math.round(value)}%`,
    },
    { label: t.statOvertime, value: h.overtimeCount, format: count },
    { label: t.statStrike, value: h.strikes, format: count },
  ]

  return (
    <div className="relative isolate flex h-full animate-fade flex-col overflow-hidden px-6 py-5">
      <VictoryEffects won={won} />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <header className={`flex items-center gap-5 border-[3px] border-ink px-5 py-3 text-card ${won ? 'bg-teal' : 'stripes animate-shake bg-red'}`}>
          {won ? (
            <Trophy size={52} strokeWidth={2.2} className="shrink-0" />
          ) : (
            <span className="flex shrink-0 items-center gap-2">
              <Skull size={52} strokeWidth={2.5} />
              <TriangleAlert size={42} strokeWidth={2.8} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-[34px] leading-none font-black">{won ? t.winTitle : t.loseTitle}</h1>
            <p className="mt-2 text-[18px] leading-snug">{analysis.verdict}</p>
          </div>
          <button
            ref={replayRef}
            onClick={onReplay}
            className="btn flex shrink-0 items-center gap-2 border-[3px] border-ink bg-card px-5 py-3 text-[20px] font-black text-ink"
          >
            <RotateCcw size={24} strokeWidth={3} />
            {t.replay}
          </button>
        </header>

        <div className="mt-3 grid grid-cols-7 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="border-[3px] border-ink bg-card px-3 py-2">
              <div className="text-[16px] leading-tight font-bold text-mute">{stat.label}</div>
              <AnimatedNumber value={stat.value} from={0} format={stat.format} className="text-[26px] leading-tight font-black" />
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="flex items-center gap-2 bg-ink px-3 py-[6px] text-[17px] leading-none font-black tracking-[0.12em] text-amber">
            <Bot size={22} strokeWidth={2.5} />
            {t.aiLabel}
          </span>
          <span className="text-[16px] leading-none text-mute">{t.aiNote}</span>
        </div>

        <div className="mt-3 grid min-h-0 flex-1 grid-cols-[1fr_1.3fr_1fr] gap-4">
          {analysis.groups.map((group, index) => (
            <section
              key={group.title}
              className="animate-fade overflow-y-auto border-[3px] border-ink bg-card px-4 py-3"
              style={{ animationDelay: `${150 + index * 120}ms` }}
            >
              <h2 className="border-b-[3px] border-ink pb-2 text-[19px] leading-tight font-black">{group.title}</h2>
              {group.items.map((item) => (
                <p key={item.text} className="mt-[10px] text-[16px] leading-[1.38]">
                  {item.label && <b className="font-black text-red">{item.label}: </b>}
                  {item.text}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
