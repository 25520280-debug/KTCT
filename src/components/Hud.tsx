import { AlertTriangle, Banknote, BookOpen, Info, ShoppingBag, Siren, Smile, Target, type LucideIcon } from 'lucide-react'
import { CONFIG } from '../config'
import * as G from '../engine/engine'
import { fill, money } from '../engine/format'
import type { ForecastLevel, GameState } from '../engine/types'
import { HUD_RIGHT, HUD_TOP } from '../world/layout'
import AnimatedNumber from './AnimatedNumber'

const FORECAST_STYLE: Record<ForecastLevel, { box: string; icon: LucideIcon }> = {
  danger: { box: 'bg-red text-card', icon: Siren },
  warn: { box: 'bg-amber text-ink', icon: AlertTriangle },
  info: { box: 'bg-card text-ink', icon: Info },
}

function DefinitionHint({
  id,
  title,
  body,
  example,
  children,
}: {
  id: string
  title: string
  body: string
  example: string
  children: string
}) {
  const tooltipId = `definition-${id}`
  return (
    <span className="group relative block">
      <button
        type="button"
        aria-describedby={tooltipId}
        className="text-left underline decoration-dotted decoration-1 underline-offset-2 hover:text-red focus-visible:text-red"
      >
        {children}
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        className="invisible absolute top-full right-0 z-50 mt-2 block w-[310px] border-[3px] border-ink bg-card p-3 text-ink opacity-0 shadow-hard-sm transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
      >
        <span className="block text-[17px] leading-tight font-black">{title}</span>
        <span className="mt-1 block text-[15px] leading-snug">{body}</span>
        <span className="mt-2 block border-l-4 border-amber bg-paper px-2 py-1 text-[14px] leading-snug font-bold">
          {example}
        </span>
      </span>
    </span>
  )
}

function ValueRow({
  letter,
  name,
  value,
  tone,
  definition,
}: {
  letter: string
  name: string
  value: number
  tone: string
  definition: { title: string; body: string; example: string }
}) {
  return (
    <div className="flex h-[56px] items-center border-[3px] border-ink bg-card pr-3">
      <div className={`flex h-full w-[50px] shrink-0 items-center justify-center text-[34px] leading-none font-black ${tone}`}>
        {letter}
      </div>
      <div className="ml-2 w-[82px] text-[15px] leading-[1.1] font-bold">
        <DefinitionHint id={letter} {...definition}>
          {name}
        </DefinitionHint>
      </div>
      <AnimatedNumber value={value} format={money} className="ml-auto text-[25px] leading-none font-black" />
    </div>
  )
}

// HUD luôn hiện: dải trên (tiền, tư bản, hài lòng, chu kỳ) và cột phải (bảng c-v-m, dự báo).
export default function Hud({ game, onHelp }: { game: GameState; onHelp: () => void }) {
  const t = CONFIG.text
  const p = G.project(game)
  const capital = G.totalCapital(game)
  const goal = G.target(game)
  const sat = game.satisfaction
  const satColor = sat < CONFIG.satisfaction.lowThreshold ? 'bg-red' : sat < 50 ? 'bg-amber' : 'bg-teal'
  const forecast = G.forecast(game)
  const ForecastIcon = FORECAST_STYLE[forecast.level].icon
  const definitions = t.definitions
  const lastConsumed = game.history.turns.at(-1)?.consumed ?? 0
  const consumerSat = G.consumerSatisfaction(game)
  const consumerTarget = CONFIG.consumerNeed.requiredSatisfaction
  const ratios = [
    {
      id: 'organic',
      label: t.ratioOrganic,
      value: p.v > 0 ? p.c / p.v : null,
      format: (v: number) => v.toFixed(2),
      definition: definitions.organic,
      example:
        p.v > 0
          ? fill(definitions.organic.example, {
              c: money(p.c),
              v: money(p.v),
              ratio: (p.c / p.v).toFixed(2),
              perWage: (p.c / p.v).toFixed(2),
            })
          : definitions.organic.empty,
    },
    {
      id: 'surplus',
      label: t.ratioSurplus,
      value: p.v > 0 ? (p.m / p.v) * 100 : null,
      format: (v: number) => `${Math.round(v)}%`,
      definition: definitions.surplus,
      example:
        p.v > 0
          ? fill(definitions.surplus.example, {
              m: money(p.m),
              v: money(p.v),
              ratio: `${Math.round((p.m / p.v) * 100)}%`,
              perWage: money((p.m / p.v) * 100),
            })
          : definitions.surplus.empty,
    },
  ]

  return (
    <>
      <header
        className="absolute inset-x-0 top-0 z-10 flex items-center gap-6 bg-ink px-5 text-card"
        style={{ height: HUD_TOP }}
      >
        <h1 className="text-[22px] leading-none font-black tracking-tight whitespace-nowrap">{t.title}</h1>

        <div className="flex items-center gap-2">
          <Banknote size={28} strokeWidth={2.5} className="text-amber" />
          <div>
            <div className="text-[16px] leading-none">{t.cash}</div>
            <AnimatedNumber value={game.cash} format={money} className="block text-[28px] leading-none font-black text-amber" />
          </div>
        </div>

        <div className="w-[320px]">
          <div className="flex items-baseline justify-between text-[16px] leading-none whitespace-nowrap">
            <span>
              {t.capital} <AnimatedNumber value={capital} format={money} className="text-[22px] font-black" />
            </span>
            <span className="flex items-center gap-1 font-bold text-amber">
              <Target size={17} strokeWidth={2.5} />
              {money(goal)}
            </span>
          </div>
          <div className="mt-[6px] h-[12px] border-2 border-card">
            <div
              className="h-full bg-red transition-[width] duration-500 ease-out"
              style={{ width: `${Math.min(100, (capital / goal) * 100)}%` }}
            />
          </div>
        </div>

        <div className="w-[290px]">
          <div className="flex items-baseline justify-between text-[16px] leading-none whitespace-nowrap">
            <span className="flex items-center gap-1">
              <Smile size={18} strokeWidth={2.5} />
              {t.satisfaction}
            </span>
            <AnimatedNumber value={sat} format={(v) => String(Math.round(v))} className="text-[22px] font-black" />
          </div>
          <div className="mt-[6px] h-[12px] border-2 border-card">
            <div
              className={`h-full transition-[width,background-color] duration-500 ease-out ${satColor}`}
              style={{ width: `${sat}%` }}
            />
          </div>
        </div>

        <div className="ml-auto text-right whitespace-nowrap">
          <div className="text-[16px] leading-none">{t.turnName}</div>
          <div className="text-[28px] leading-none font-black">
            {game.turn}/{CONFIG.totalTurns}
          </div>
        </div>
        <button
          onClick={onHelp}
          className="flex shrink-0 items-center gap-2 border-2 border-card px-3 py-2 text-[16px] font-bold transition-colors hover:bg-card hover:text-ink"
        >
          <BookOpen size={20} strokeWidth={2.5} />
          {CONFIG.text.help.open}
        </button>
      </header>

      <aside
        className="absolute right-0 bottom-0 z-10 flex flex-col gap-[10px] border-l-[3px] border-ink bg-paper p-3"
        style={{ top: HUD_TOP, width: HUD_RIGHT }}
      >
        <div className="text-[16px] leading-none font-black tracking-[0.08em] text-mute uppercase">{t.tableTitle}</div>
        <ValueRow
          letter={t.cName}
          name={t.cFull}
          value={p.c}
          tone="bg-ink text-card"
          definition={{
            ...definitions.c,
            example: fill(definitions.c.example, {
              materials: money(p.materials),
              depreciation: money(p.depreciation),
              total: money(p.c),
            }),
          }}
        />
        <ValueRow
          letter={t.vName}
          name={t.vFull}
          value={p.v}
          tone="bg-teal text-card"
          definition={{
            ...definitions.v,
            example:
              game.workers > 0
                ? fill(definitions.v.example, { workers: game.workers, total: money(p.v) })
                : definitions.v.empty,
          }}
        />
        <ValueRow
          letter={t.mName}
          name={t.mFull}
          value={p.m}
          tone="bg-amber text-ink"
          definition={{
            ...definitions.m,
            example: fill(definitions.m.example, {
              revenue: money(p.revenue),
              c: money(p.c),
              v: money(p.v),
              total: money(p.m),
            }),
          }}
        />

        {ratios.map((item) => {
          const [symbol, name] = item.label.split(' · ')
          return (
            <div key={item.label} className="flex h-[52px] items-center justify-between border-[3px] border-ink bg-card px-3">
              <div className="w-[150px]">
                <div className="text-[20px] leading-none font-black">{symbol}</div>
                <div className="text-[15px] leading-tight font-medium">
                  <DefinitionHint id={item.id} {...item.definition} example={item.example}>
                    {name}
                  </DefinitionHint>
                </div>
              </div>
              {item.value === null ? (
                <span className="text-[28px] leading-none font-black">—</span>
              ) : (
                <AnimatedNumber value={item.value} format={item.format} className="text-[28px] leading-none font-black" />
              )}
            </div>
          )
        })}

        <section
          aria-label="Chi tiêu cá nhân"
          title={fill(CONFIG.text.result.consumerNeedHelp, { required: consumerTarget })}
          className="border-[3px] border-ink bg-amber/30 px-3 py-2"
        >
          <div className="flex items-center gap-2 text-[15px] leading-tight font-black">
            <ShoppingBag size={20} strokeWidth={2.5} className="shrink-0" />
            <span>{CONFIG.text.result.consumerNeed.toUpperCase()}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="relative h-[14px] flex-1 border-2 border-ink bg-card">
              <div
                className={`h-full transition-[width] duration-500 ${consumerSat >= consumerTarget ? 'bg-teal' : 'bg-amber'}`}
                style={{ width: `${consumerSat}%` }}
              />
              <span
                className="absolute -top-[3px] bottom-[-3px] w-[3px] bg-red"
                style={{ left: `${consumerTarget}%` }}
              />
            </div>
            <AnimatedNumber
              value={consumerSat}
              format={(value) => `${Math.round(value)}%`}
              className="w-[48px] text-right text-[18px] leading-none font-black"
            />
          </div>
          <p className="mt-1 text-[13px] leading-tight text-mute">
            {consumerSat >= consumerTarget
              ? CONFIG.text.result.consumerSatisfied
              : fill(CONFIG.text.result.consumerRemaining, {
                  amount: money(
                    Math.max(
                      0,
                      Math.ceil(
                        (G.consumerSpendForFullSatisfaction(game) * consumerTarget) / 100 -
                          game.history.consumed,
                      ),
                    ),
                  ),
                })}
          </p>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <span className="text-[14px] leading-tight text-mute">Đã chi tiêu</span>
            <AnimatedNumber value={game.history.consumed} format={money} className="text-[23px] leading-none font-black" />
          </div>
          {lastConsumed > 0 && (
            <div className="mt-1 text-[14px] leading-tight font-bold text-red">
              Chu kỳ gần nhất: −{money(lastConsumed)} khỏi vốn sản xuất
            </div>
          )}
        </section>

        <div
          role="status"
          className={`flex flex-1 items-start gap-2 border-[3px] border-ink p-[10px] text-[16px] leading-snug font-bold ${FORECAST_STYLE[forecast.level].box}`}
        >
          <ForecastIcon size={24} strokeWidth={2.5} className="mt-[1px] shrink-0" />
          <span key={forecast.text} className="animate-fade">
            {forecast.text}
          </span>
        </div>

        <p className="text-[16px] leading-[1.25] text-mute">{t.world.controls}</p>
      </aside>
    </>
  )
}
