import { BookOpen, Bot, Check, Gavel, Palmtree, PartyPopper, Users, X, type LucideIcon } from 'lucide-react'
import { CONFIG } from '../config'
import { eventOffer, resolveEvent } from '../engine/engine'
import { fill } from '../engine/format'
import type { EventInstance, GameState } from '../engine/types'
import Modal from './Modal'

type EventKey = keyof typeof CONFIG.text.events

function eventKey(event: EventInstance): EventKey {
  if (event.type !== 'welfare') return event.type
  return event.variant === 'leave' ? 'welfareLeave' : 'welfareTeamBuilding'
}

const ICONS: Record<EventKey, LucideIcon> = {
  unemployment: Users,
  machine: Bot,
  welfareTeamBuilding: PartyPopper,
  welfareLeave: Palmtree,
  rival: Gavel,
}

interface Props {
  game: GameState
  onChange: (game: GameState) => void
  onExit: () => void
}

export default function EventPopup({ game, onChange, onExit }: Props) {
  const offer = eventOffer(game)
  if (!offer) return null
  const common = CONFIG.text.eventCommon
  const key = eventKey(offer.event)
  const text: { title: string; body: string; bodyReplace?: string; theory: string; yes: string; no: string; effectYes: string; effectNo?: string } =
    CONFIG.text.events[key]
  const Icon = ICONS[key]
  const body = text.body + (text.bodyReplace && Number(offer.vars.replace) > 0 ? text.bodyReplace : '')

  return (
    <Modal
      width={760}
      onClose={onExit}
      closeLabel="Thoát ván"
      closeAriaLabel="Thoát ván về màn hình chính"
    >
      <div className="text-[16px] leading-none font-black tracking-[0.2em] text-red">
        {common.label} · {CONFIG.text.turnName} {game.turn}
      </div>
      <div className="mt-4 flex items-center gap-4">
        <div className="flex size-[68px] shrink-0 items-center justify-center bg-ink text-amber">
          <Icon size={40} strokeWidth={2.2} />
        </div>
        <h2 className="text-[36px] leading-tight font-black">{text.title}</h2>
      </div>

      <p className="mt-5 text-[21px] leading-snug">{fill(body, offer.vars)}</p>

      <div className="mt-5 flex gap-3 border-l-[8px] border-amber bg-paper px-4 py-3">
        <BookOpen size={26} strokeWidth={2.5} className="mt-[2px] shrink-0" />
        <p className="text-[18px] leading-snug">
          <b className="font-black">{common.theory}: </b>
          {text.theory}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <button
          onClick={() => onChange(resolveEvent(game, true))}
          disabled={!offer.canAccept}
          className="btn border-[3px] border-ink bg-teal px-14 py-3 text-left text-card"
        >
          <span className="flex items-center gap-2 text-[24px] leading-tight font-black">
            <Check size={28} strokeWidth={3} />
            {text.yes}
          </span>
          <span className="mt-1 block text-[16px] leading-tight">
            {offer.canAccept ? fill(text.effectYes, offer.vars) : common.noCash}
          </span>
        </button>
        <button
          onClick={() => onChange(resolveEvent(game, false))}
          className="btn border-[3px] border-ink bg-card px-14 py-3 text-left"
        >
          <span className="flex items-center gap-2 text-[24px] leading-tight font-black">
            <X size={28} strokeWidth={3} />
            {text.no}
          </span>
          <span className="mt-1 block min-h-[20px] text-[16px] leading-tight text-mute">
            {text.effectNo ? fill(text.effectNo, offer.vars) : ''}
          </span>
        </button>
      </div>
    </Modal>
  )
}
