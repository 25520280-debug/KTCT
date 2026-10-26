import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CONFIG } from '../config'
import EventPopup from '../components/EventPopup'
import HowToPlay from '../components/HowToPlay'
import Hud from '../components/Hud'
import ResultPopup from '../components/ResultPopup'
import TutorialCoach from '../components/TutorialCoach'
import WorldCanvas from '../components/WorldCanvas'
import ZoneMenu from '../components/ZoneMenu'
import * as G from '../engine/engine'
import { step, type Action } from '../engine/engine'
import { fill, money } from '../engine/format'
import type { TutorialStep } from '../tutorial'
import type { GameState } from '../engine/types'
import type { CameraTransform, WorldView } from '../world/FactoryScene'
import { HUD_RIGHT, HUD_TOP, ROOMS, ZONES, type ZoneId } from '../world/layout'

interface Props {
  game: GameState
  onChange: (game: GameState) => void
  onExit: () => void
}

export default function GameScreen({ game, onChange, onExit }: Props) {
  const w = CONFIG.text.world
  const [menu, setMenu] = useState<ZoneId | null>(null)
  const [near, setNear] = useState<ZoneId | null>(null)
  const [cameraTransform, setCameraTransform] = useState<CameraTransform>({ x: 0, y: 0, scale: 1 })
  const [showHelp, setShowHelp] = useState(false)
  const [tutorialStep, setTutorialStep] = useState<TutorialStep>('goHr')
  const [tutorialBriefing, setTutorialBriefing] = useState(true)
  const [machineGuideSeen, setMachineGuideSeen] = useState(false)
  const [factoryGuideSeen, setFactoryGuideSeen] = useState(false)
  const [visualEffect, setVisualEffect] = useState<{ id: number; kind: 'machine' | 'factory' } | null>(null)
  const visualEffectId = useRef(0)
  const [productionEffect, setProductionEffect] = useState<{
    id: number
    wages: number[]
    surplus: number
  } | null>(null)
  const productionEffectId = useRef(0)
  // Kết quả đã tính xong nhưng còn chờ hoạt ảnh băng chuyền chạy hết.
  const [pending, setPending] = useState<GameState | null>(null)
  const [resultSeen, setResultSeen] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  const animating = pending !== null
  const showResult = game.phase === 'result' && !resultSeen && !animating
  const surplusWaiting = game.phase === 'result' && resultSeen
  const busy = animating || showResult || game.phase === 'event' || visualEffect !== null || tutorialBriefing
  const applyGameChange = (next: GameState) => {
    if (next.factories > game.factories) {
      setVisualEffect({ id: ++visualEffectId.current, kind: 'factory' })
    } else if (next.machineLevel > game.machineLevel || next.newGenMachines > game.newGenMachines) {
      setVisualEffect({ id: ++visualEffectId.current, kind: 'machine' })
    }
    onChange(next)
  }

  useEffect(() => {
    if (!visualEffect) return
    const timeout = window.setTimeout(() => setVisualEffect(null), 2400)
    return () => window.clearTimeout(timeout)
  }, [visualEffect])

  useEffect(() => {
    if (tutorialStep !== 'done' || tutorialBriefing || visualEffect || game.phase !== 'plan') return

    const machinePrice = G.upgradeCost(game)
    if (!machineGuideSeen && machinePrice !== null && game.cash >= machinePrice) {
      setMachineGuideSeen(true)
      setTutorialStep('upgradeMachine')
      setTutorialBriefing(true)
      return
    }

    const factoryPrice = G.factoryCost(game)
    if (!factoryGuideSeen && factoryPrice !== null && game.cash >= factoryPrice) {
      setFactoryGuideSeen(true)
      setTutorialStep('expandFactory')
      setTutorialBriefing(true)
    }
  }, [factoryGuideSeen, game, machineGuideSeen, tutorialBriefing, tutorialStep, visualEffect])

  const dispatch = useCallback(
    (action: Action) => {
      const next = step(game, action)
      if (action.type === 'allocate') {
        setMenu(null)
        setResultSeen(false)
        if (tutorialStep === 'allocate') {
          setTutorialStep('done')
          setTutorialBriefing(false)
        }
      }
      if (action.type === 'upgradeMachine' && next.machineLevel > game.machineLevel) {
        setMenu(null)
        if (tutorialStep === 'upgradeMachine') {
          setTutorialStep('done')
          setTutorialBriefing(false)
        }
      }
      if (action.type === 'openFactory' && next.factories > game.factories) {
        setMenu(null)
        if (tutorialStep === 'expandFactory') {
          setTutorialStep('done')
          setTutorialBriefing(false)
        }
      }
      if (action.type === 'hire' && next.workers > game.workers && tutorialStep === 'hire') {
        setMenu(null)
        setTutorialStep('goLever')
        setTutorialBriefing(true)
      }
      applyGameChange(next)
    },
    [game, onChange, tutorialStep],
  )

  const openZone = (zone: ZoneId) => {
    setMenu(zone)
    if (tutorialStep === 'goHr' && zone === 'hr') {
      setTutorialStep('hire')
      setTutorialBriefing(true)
    }
    if (tutorialStep === 'goLever' && zone === 'lever') {
      setTutorialStep('produce')
      setTutorialBriefing(true)
    }
    if (tutorialStep === 'goSafe' && zone === 'safe') {
      setTutorialStep('allocate')
      setTutorialBriefing(true)
    }
  }

  // Kéo cần gạt: engine tính ngay, giao diện chạy hoạt ảnh rồi mới hiện kết quả.
  const produce = () => {
    const next = step(game, { type: 'produce' })
    if (next === game) return
    setMenu(null)
    if (tutorialStep === 'produce') {
      setTutorialStep(next.lastResult?.bankrupt ? 'done' : 'result')
      setTutorialBriefing(false)
    }
    const result = next.lastResult!
    if (!result.bankrupt && !result.strike && game.workers > 0) {
      const regularWorkers = game.workers - game.cheapWorkers
      const cheapWage = G.cheapWage(game)
      setProductionEffect({
        id: ++productionEffectId.current,
        wages: Array.from({ length: game.workers }, (_, index) =>
          index < regularWorkers ? game.wage : cheapWage,
        ),
        surplus: Math.max(0, result.m),
      })
    }
    if (result.bankrupt) return applyGameChange(next)
    setPending(next)
    const { produceMs, strikeMs } = CONFIG.animation
    timer.current = window.setTimeout(
      () => {
        setPending(null)
        applyGameChange(next)
      },
      result.strike ? strikeMs : produceMs,
    )
  }
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const closeResult = () => {
    const result = game.lastResult!
    if (game.pendingOutcome || result.m <= 0) {
      if (tutorialStep === 'result') {
        setTutorialStep('done')
        setTutorialBriefing(false)
      }
      dispatch({ type: 'allocate', allocation: 'all' })
    } else {
      if (tutorialStep === 'result') {
        setTutorialStep('goSafe')
        setTutorialBriefing(true)
      }
      setResultSeen(true)
    }
  }

  // Phím số 1-5 mở nhanh menu từng khu vực, Esc đóng.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (showHelp) {
        if (event.key === 'Escape') setShowHelp(false)
        return
      }
      if (tutorialBriefing) return
      if (busy) return
      if (event.key === 'Escape') setMenu(null)
      const zone = ZONES.find((z) => z.key === event.key)
      if (zone) {
        if (menu === zone.id) setMenu(null)
        else openZone(zone.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, menu, showHelp, tutorialBriefing])

  const view = useMemo<WorldView>(() => {
    const sat = game.satisfaction
    return {
      workers: game.workers,
      cheapWorkers: game.cheapWorkers,
      factories: game.factories,
      machineLevel: game.machineLevel,
      newGenMachines: game.newGenMachines,
      mood: sat < CONFIG.satisfaction.lowThreshold ? 'angry' : sat < 50 ? 'neutral' : 'happy',
      overtime: game.overtime,
      locked: busy || menu !== null || showHelp || tutorialBriefing,
      tutorialTarget:
        !tutorialBriefing && tutorialStep === 'goHr'
          ? 'hr'
          : !tutorialBriefing && tutorialStep === 'goLever'
            ? 'lever'
            : !tutorialBriefing && tutorialStep === 'goSafe'
              ? 'safe'
              : null,
      visualEffect,
      productionEffect,
      mode: pending ? (pending.lastResult!.strike ? 'strike' : 'producing') : 'idle',
      crowd: game.phase === 'event' && game.pendingEvent?.type === 'unemployment',
      surplusWaiting,
    }
  }, [game, busy, menu, pending, productionEffect, showHelp, surplusWaiting, tutorialBriefing, tutorialStep, visualEffect])

  const banner = pending
    ? pending.lastResult!.strike
      ? { text: w.striking, tone: 'bg-red text-card' }
      : { text: w.producing, tone: 'bg-ink text-amber' }
    : surplusWaiting
      ? { text: fill(w.goSafe, { m: money(game.lastResult!.m) }), tone: 'bg-amber text-ink' }
      : null

  return (
    <div className="relative h-full animate-fade">
      <WorldCanvas view={view} onNear={setNear} onInteract={openZone} onCameraTransform={setCameraTransform} />

      {/* Nhãn chữ trong thế giới làm bằng HTML để sắc nét trên máy chiếu */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            transform: `translate3d(${cameraTransform.x}px, ${cameraTransform.y}px, 0) scale(${cameraTransform.scale})`,
            transformOrigin: 'top left',
          }}
        >
          {ZONES.map((zone) => {
            const highlighted = near === zone.id && menu === null && !busy
            return (
              <div
                key={zone.id}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 whitespace-nowrap"
                style={{ left: zone.labelX, top: zone.labelY }}
              >
                <span
                  className={`flex items-center gap-[6px] border-2 border-ink px-[6px] text-[16px] leading-[22px] font-bold ${
                    highlighted || (zone.id === 'safe' && surplusWaiting) ? 'bg-amber' : 'bg-card'
                  }`}
                >
                  <b className="bg-ink px-[5px] font-black text-card">{zone.key}</b>
                  {w.zones[zone.id]}
                </span>
                {highlighted && (
                  <span className="animate-pop bg-red px-2 text-[18px] leading-[26px] font-black text-card shadow-hard-sm">{w.pressE}</span>
                )}
              </div>
            )
          })}
          {ROOMS.slice(1).map((room, index) => (
            <span
              key={index}
              className={`absolute text-[16px] leading-none font-bold ${index + 1 < game.factories ? '' : 'text-ink/45'}`}
              style={{ left: room.x + 20, top: room.y + 20 }}
            >
              {index + 1 < game.factories ? `${w.factory} ${index + 2}` : w.emptyLot}
            </span>
          ))}
        </div>
      </div>
      {banner && (
        <div className="pointer-events-none absolute flex justify-center" style={{ left: 0, right: HUD_RIGHT, top: HUD_TOP + 200 }}>
          <span key={banner.text} className={`animate-pop border-[3px] border-ink px-4 text-[20px] leading-[38px] font-black shadow-hard-sm ${banner.tone}`}>
            {banner.text}
          </span>
        </div>
      )}

      <Hud game={game} onHelp={() => setShowHelp(true)} onExit={onExit} />

      {tutorialBriefing && tutorialStep !== 'done' && tutorialStep !== 'result' && !showHelp && (
        <TutorialCoach
          step={tutorialStep}
          near={near}
          onContinue={() => {
            setTutorialBriefing(false)
            if (tutorialStep === 'upgradeMachine') setMenu('machine')
            if (tutorialStep === 'expandFactory') setMenu('gate')
          }}
          onSkip={() => {
            setMachineGuideSeen(true)
            setFactoryGuideSeen(true)
            setTutorialStep('done')
            setTutorialBriefing(false)
          }}
        />
      )}
      {menu && !busy && (
        <ZoneMenu
          key={menu}
          zone={menu}
          game={game}
          surplusWaiting={surplusWaiting}
          dispatch={dispatch}
          onProduce={produce}
          onClose={() => setMenu(null)}
          tutorialStep={tutorialStep}
        />
      )}
      {game.phase === 'event' && !animating && (
        <EventPopup key={`event-${game.turn}`} game={game} onChange={applyGameChange} onExit={onExit} />
      )}
      {showResult && (
        <ResultPopup
          key={`result-${game.turn}`}
          game={game}
          onContinue={closeResult}
          guided={tutorialStep === 'result'}
        />
      )}
      {showHelp && <HowToPlay onClose={() => setShowHelp(false)} />}
    </div>
  )
}
