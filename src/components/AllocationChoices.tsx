import { CONFIG, type AllocationId } from '../config'
import { fill, money } from '../engine/format'
import * as G from '../engine/engine'
import type { GameState } from '../engine/types'

interface Props {
  surplus: number
  guided?: boolean
  game: GameState
  requiredSatisfaction: number
  onChoose: (allocation: AllocationId) => void
}

// Ba cách dùng m: phần tái đầu tư thành tư bản mới, phần tiêu dùng rời khỏi tư bản.
export default function AllocationChoices({
  surplus,
  guided = false,
  game,
  requiredSatisfaction,
  onChoose,
}: Props) {
  const r = CONFIG.text.result
  return (
    <div className="flex flex-col gap-3">
      {CONFIG.allocations.map((option) => {
        const consumed = Math.round(surplus * (1 - option.reinvest))
        const satisfactionBefore = G.consumerSatisfaction(game)
        const satisfactionAfter = G.consumerSatisfactionAfter(game, consumed)
        const satisfactionGain = satisfactionAfter - satisfactionBefore
        return (
          <button
            key={option.id}
            onClick={() => onChoose(option.id)}
            className={`btn relative border-[3px] border-ink bg-card px-4 py-[10px] text-left ${
              guided ? 'ring-4 ring-red ring-offset-2' : ''
            }`}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="text-[19px] leading-tight font-black">{option.label}</span>
              <span className="flex h-[14px] w-[120px] shrink-0 border-2 border-ink">
                <span className="bg-amber" style={{ width: `${option.reinvest * 100}%` }} />
                <span className="flex-1 bg-ink/15" />
              </span>
            </span>
            <span className="mt-1 block text-[17px] leading-tight">
              <b className="font-black text-teal">+{money(surplus - consumed)}</b> {r.reinvest}
              <span className="text-mute">
                {' '}
                · −{money(consumed)} {r.consume}
              </span>
            </span>
            <span className="mt-1 block text-[15px] leading-tight font-black text-amber-800">
              {consumed > 0
                ? fill(r.consumerGain, { points: satisfactionGain })
                : r.consumerNoGain}{' '}
              · mục tiêu {requiredSatisfaction}%
            </span>
          </button>
        )
      })}
    </div>
  )
}
