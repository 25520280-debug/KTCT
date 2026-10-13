import { ArrowRight, Megaphone, Skull } from 'lucide-react'
import { CONFIG } from '../config'
import { fill, money } from '../engine/format'
import type { GameState } from '../engine/types'
import AnimatedNumber from './AnimatedNumber'
import Modal from './Modal'

interface Props {
  game: GameState
  onContinue: () => void
  guided?: boolean
}

// Popup sau mỗi chu kỳ: c, v, m và lời giải thích. Việc phân bổ m diễn ra ở két sắt.
export default function ResultPopup({ game, onContinue, guided = false }: Props) {
  const result = game.lastResult
  if (!result) return null
  const t = CONFIG.text
  const r = t.result
  const ending = game.pendingOutcome
  const vars = { cost: money(result.v), cash: money(result.cashBefore), advance: money(result.advance) }

  const alert = result.bankrupt
    ? { title: r.bankruptTitle, text: r.bankrupt, icon: Skull }
    : ending === 'strike'
      ? { title: r.strikeLoseTitle, text: r.strikeLose, icon: Megaphone }
      : result.strike
        ? { title: r.strikeTitle, text: r.strike, icon: Megaphone }
        : null

  const tiles = [
    { letter: t.cName, name: t.cFull, value: result.c, tone: 'bg-ink text-card' },
    { letter: t.vName, name: t.vFull, value: result.v, tone: 'bg-teal text-card' },
    { letter: t.mName, name: t.mFull, value: result.m, tone: 'bg-amber text-ink' },
  ]
  const hasSurplus = !ending && result.m > 0

  return (
    <Modal width={860} shake={alert !== null}>
      <div className="flex items-baseline justify-between">
        <h2 className="text-[30px] leading-none font-black">{fill(r.title, { turn: result.turn })}</h2>
        {!result.bankrupt && !result.strike && (
          <span className="text-[20px] leading-none">
            {r.revenue} <b className="text-[26px] font-black">{money(result.revenue)}</b>
          </span>
        )}
      </div>

      {alert && (
        <div className="stripes mt-4 flex items-center gap-4 border-[3px] border-ink bg-red px-4 py-3 text-card">
          <alert.icon size={44} strokeWidth={2.2} className="shrink-0" />
          <div>
            <div className="text-[28px] leading-tight font-black">{alert.title}</div>
            <p className="text-[18px] leading-snug">{fill(alert.text, vars)}</p>
          </div>
        </div>
      )}

      {!result.bankrupt && (
        <div className="mt-4 grid grid-cols-3 gap-4">
          {tiles.map((tile) => (
            <div key={tile.letter} className="flex border-[3px] border-ink bg-card">
              <div className={`flex w-[64px] shrink-0 items-center justify-center text-[44px] leading-none font-black ${tile.tone}`}>
                {tile.letter}
              </div>
              <div className="px-3 py-2">
                <div className="text-[16px] leading-tight font-bold">{tile.name}</div>
                <AnimatedNumber value={tile.value} from={0} format={money} className="text-[34px] leading-tight font-black" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!alert && <p className="mt-4 text-[20px] leading-snug">{result.overtime ? r.overtime : r.normal}</p>}
      {hasSurplus && <p className="mt-3 border-l-[8px] border-amber bg-paper px-4 py-3 text-[18px] leading-snug">{r.allocateNote}</p>}
      {!ending && !hasSurplus && <p className="mt-4 text-[19px] leading-snug">{r.noSurplus}</p>}
      {guided && (
        <p className="mt-4 border-l-[8px] border-red bg-amber/40 px-4 py-3 text-[18px] leading-snug">
          {CONFIG.text.tutorial.result}
        </p>
      )}

      <button
        onClick={onContinue}
        className="btn mt-6 flex w-full items-center justify-center gap-3 border-[3px] border-ink bg-ink py-4 text-[24px] font-black text-card"
      >
        {ending ? r.toEnd : hasSurplus ? t.world.toSafe : r.next}
        <ArrowRight size={28} strokeWidth={3} />
      </button>
    </Modal>
  )
}
