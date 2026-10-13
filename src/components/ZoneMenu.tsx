import {
  AlertTriangle,
  CircleDollarSign,
  Cog,
  DoorOpen,
  Factory,
  PartyPopper,
  Play,
  Timer,
  UserPlus,
  Users,
  Vault,
  type LucideIcon,
} from 'lucide-react'
import { useRef } from 'react'
import { CONFIG } from '../config'
import * as G from '../engine/engine'
import { fill, money } from '../engine/format'
import type { GameState } from '../engine/types'
import type { TutorialStep } from '../tutorial'
import { HUD_RIGHT, HUD_TOP, ZONES, type ZoneId } from '../world/layout'
import AllocationChoices from './AllocationChoices'
import useFocusNav from './useFocusNav'

const ZONE_ICONS: Record<ZoneId, LucideIcon> = { machine: Cog, hr: Users, lever: Play, safe: Vault, gate: DoorOpen }

interface ItemProps {
  icon: LucideIcon
  title: string
  sub: string
  price?: string
  disabled?: boolean
  risky?: boolean
  active?: boolean
  className?: string
  onClick: () => void
}

function Item({ icon: Icon, title, sub, price, disabled, risky, active, className = '', onClick }: ItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      title={risky ? CONFIG.text.actions.riskyBuy : undefined}
      className={`btn relative flex w-full items-center gap-3 border-[3px] border-ink px-3 py-2 text-left ${className} ${
        active ? 'stripes bg-red text-card' : 'bg-card'
      }`}
    >
      <Icon size={28} strokeWidth={2.5} className="shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block text-[19px] leading-tight font-black">{title}</span>
        <span className={`block text-[16px] leading-tight ${active ? '' : 'text-mute'}`}>{sub}</span>
      </span>
      {price && (
        <span className={`flex shrink-0 items-center gap-1 text-[22px] leading-none font-black ${risky ? 'text-red' : ''}`}>
          {risky && <AlertTriangle size={22} strokeWidth={3} />}
          {price}
        </span>
      )}
    </button>
  )
}

interface Props {
  zone: ZoneId
  game: GameState
  surplusWaiting: boolean
  dispatch: (action: G.Action) => void
  onProduce: () => void
  tutorialStep: TutorialStep
}

// Menu nhỏ của từng khu vực, mở bằng E khi đứng gần hoặc phím số 1-5.
export default function ZoneMenu({ zone, game, surplusWaiting, dispatch, onProduce, tutorialStep }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  useFocusNav(ref)
  const t = CONFIG.text
  const a = t.actions
  const w = t.world
  const { cash, workers } = game
  const Icon = ZONE_ICONS[zone]
  const pct = (value: number) => Math.round(value * 100)
  const risky = (action: G.Action) => workers > 0 && !G.leavesEnoughCash(game, G.step(game, action))
  const planning = game.phase === 'plan'
  const mechanicGuide = t.help.zoneHelp[zone]

  let body
  if (zone === 'machine') {
    const price = G.upgradeCost(game)
    body = (
      <>
        <p className="text-[18px] leading-snug">
          {w.machine} <b className="font-black">{game.machineLevel}/{CONFIG.machine.maxLevel}</b> · {w.productivity}{' '}
          <b className="font-black">×{G.productivity(game).toFixed(1)}</b>
        </p>
        <Item
          icon={Cog}
          title={a.upgrade}
          sub={price === null ? a.upgradeMax : fill(a.upgradeSub, { pct: pct(CONFIG.machine.productivityPerLevel) })}
          price={price === null ? undefined : money(price)}
          disabled={!planning || price === null || cash < price}
          risky={planning && risky({ type: 'upgradeMachine' })}
          className={tutorialStep === 'upgradeMachine' ? 'ring-4 ring-red ring-offset-2' : ''}
          onClick={() => dispatch({ type: 'upgradeMachine' })}
        />
      </>
    )
  } else if (zone === 'hr') {
    const canHire = planning ? G.maxHire(game) : 0
    const isFull = workers >= G.capacity(game)
    const hireSub = isFull ? a.hireFull : canHire === 0 ? a.hireNoCash : fill(a.hireSub, { wage: money(game.wage) })
    const teamBuildingPrice = G.teamBuildingCost(game)
    const canOvertime = planning && workers > 0 && G.canToggleOvertime(game)
    body = (
      <>
        <p className="text-[18px] leading-snug">
          {w.workers} <b className="font-black">{workers}/{G.capacity(game)}</b> · {w.wage}{' '}
          <b className="font-black">{money(game.wage)}</b>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Item
            icon={UserPlus}
            title={`+1 ${w.workers.toLowerCase()}`}
            sub={hireSub}
            price={canHire > 0 ? money(game.wage) : undefined}
            disabled={canHire === 0}
            className={tutorialStep === 'hire' ? 'ring-4 ring-red ring-offset-2' : ''}
            onClick={() => dispatch({ type: 'hire', amount: 1 })}
          />
          <Item
            icon={UserPlus}
            title={`+5 ${w.workers.toLowerCase()}`}
            sub={hireSub}
            price={canHire > 0 ? money(game.wage * Math.min(5, canHire)) : undefined}
            disabled={canHire === 0}
            onClick={() => dispatch({ type: 'hire', amount: 5 })}
          />
        </div>
        <Item
          icon={CircleDollarSign}
          title={a.raise}
          sub={workers === 0 ? a.noWorkers : game.usedRaise ? a.usedThisTurn : fill(a.raiseSub, { pct: pct(CONFIG.raise.pct), gain: CONFIG.raise.gain })}
          disabled={!planning || workers === 0 || game.usedRaise}
          risky={planning && risky({ type: 'raiseWage' })}
          onClick={() => dispatch({ type: 'raiseWage' })}
        />
        <Item
          icon={PartyPopper}
          title={a.teamBuilding}
          sub={workers === 0 ? a.noWorkers : game.usedTeamBuilding ? a.usedThisTurn : fill(a.teamBuildingSub, { gain: CONFIG.teamBuilding.gain })}
          price={workers === 0 || game.usedTeamBuilding ? undefined : money(teamBuildingPrice)}
          disabled={!planning || workers === 0 || game.usedTeamBuilding || cash < teamBuildingPrice}
          risky={planning && risky({ type: 'teamBuilding' })}
          onClick={() => dispatch({ type: 'teamBuilding' })}
        />
        <Item
          icon={Timer}
          title={a.overtime}
          sub={
            workers > 0 && planning && !canOvertime
              ? a.hireNoCash
              : fill(a.overtimeSub, { pct: pct(CONFIG.overtime.outputMult - 1), loss: CONFIG.satisfaction.overtime })
          }
          price={game.overtime ? a.overtimeOn : a.overtimeOff}
          active={game.overtime}
          disabled={!canOvertime}
          onClick={() => dispatch({ type: 'toggleOvertime' })}
        />
      </>
    )
  } else if (zone === 'lever') {
    const p = G.project(game)
    const sub = !planning ? w.leverBlocked : workers === 0 ? a.produceNoWorkers : fill(a.produceSub, { advance: money(p.advance) })
    body = (
      <>
        <p className="text-[18px] leading-snug">{G.forecast(game).text}</p>
        <button
          onClick={onProduce}
          disabled={!planning || workers === 0}
          className={`btn relative flex w-full items-center justify-center gap-4 border-[3px] border-ink bg-red px-4 py-4 text-card ${
            tutorialStep === 'produce' ? 'ring-4 ring-amber ring-offset-2 ' : ''
          }${game.overtime ? 'stripes' : ''
          }`}
        >
          <Play size={36} fill="currentColor" className="shrink-0" />
          <span className="text-left">
            <span className="block text-[34px] leading-none font-black tracking-wide">{a.produce}</span>
            <span className="mt-1 block text-[16px] leading-tight">{sub}</span>
          </span>
        </button>
      </>
    )
  } else if (zone === 'safe') {
    const surplus = game.lastResult?.m ?? 0
    body = surplusWaiting ? (
      <>
        <h3 className="text-[21px] leading-tight font-black">{fill(t.result.allocateTitle, { m: money(surplus) })}</h3>
        <AllocationChoices
          surplus={surplus}
          guided={tutorialStep === 'allocate'}
          game={game}
          requiredSatisfaction={CONFIG.consumerNeed.requiredSatisfaction}
          onChoose={(allocation) => dispatch({ type: 'allocate', allocation })}
        />
        <p className="text-[16px] leading-snug text-mute">{t.result.allocateNote}</p>
      </>
    ) : (
      <p className="text-[18px] leading-snug">{fill(w.safeIdle, { cash: money(cash) })}</p>
    )
  } else {
    const price = G.factoryCost(game)
    body = (
      <>
        <p className="text-[18px] leading-snug">
          {fill(w.gateInfo, { factories: game.factories, max: CONFIG.factory.max, capacity: CONFIG.factory.capacity })}
        </p>
        <Item
          icon={Factory}
          title={a.factory}
          sub={price === null ? fill(a.factoryMax, { max: CONFIG.factory.max }) : fill(a.factorySub, { capacity: CONFIG.factory.capacity })}
          price={price === null ? undefined : money(price)}
          disabled={!planning || price === null || cash < price}
          risky={planning && risky({ type: 'openFactory' })}
          className={tutorialStep === 'expandFactory' ? 'ring-4 ring-red ring-offset-2' : ''}
          onClick={() => dispatch({ type: 'openFactory' })}
        />
      </>
    )
  }

  return (
    <div
      className="pointer-events-none absolute left-0 z-20 flex items-center justify-center"
      style={{ top: HUD_TOP, bottom: 0, right: HUD_RIGHT }}
    >
      <div
        ref={ref}
        role="dialog"
        className="pointer-events-auto flex w-[500px] animate-pop flex-col gap-3 border-[3px] border-ink bg-paper p-4 shadow-hard"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-[40px] items-center justify-center bg-ink text-amber">
            <Icon size={26} strokeWidth={2.5} />
          </span>
          <h2 className="text-[26px] leading-none font-black">{w.zones[zone]}</h2>
          <span className="ml-auto border-2 border-ink px-2 text-[18px] leading-[26px] font-black">
            {ZONES.find((z) => z.id === zone)!.key}
          </span>
        </div>
        {body}
        <p className="border-l-4 border-amber bg-card px-3 py-2 text-[15px] leading-snug text-ink">{mechanicGuide}</p>
        <p className="text-[16px] leading-none text-mute">{w.menuKeys}</p>
      </div>
    </div>
  )
}
