// "AI phân tích": thực chất là bộ luật if/else ghép các đoạn văn viết sẵn trong config.
import { CONFIG } from '../config'
import { consumerSatisfaction, getTier, target, totalCapital } from './engine'
import { fill, money } from './format'
import type { GameState } from './types'

export interface AnalysisItem {
  label?: string
  text: string
}

export interface Analysis {
  verdict: string
  groups: { title: string; items: AnalysisItem[] }[]
}

export function analyze(s: GameState): Analysis {
  const a = CONFIG.analysis
  const h = s.history
  const tier = getTier(s.tierId)
  const outcome = s.outcome ?? 'timeout'
  const consumerNeed = consumerSatisfaction(s)

  const surplus = h.turns.reduce((sum, turn) => sum + Math.max(0, turn.m), 0)
  const lastProductive = [...h.turns].reverse().find((turn) => !turn.strike && turn.v > 0)
  const organic = lastProductive ? (lastProductive.c / lastProductive.v).toFixed(2) : '0'
  const rate = lastProductive ? Math.round((lastProductive.m / lastProductive.v) * 100) : 0
  const invested = h.machineSpend + h.laborSpend
  const machineShare = invested > 0 ? Math.round((h.machineSpend / invested) * 100) : 0
  const reinvestShare = surplus > 0 ? h.reinvested / surplus : 0

  const vars = {
    turns: h.turns.length,
    start: money(tier.capital),
    capital: money(totalCapital(s)),
    target: money(target(s)),
    satisfaction: consumerNeed,
    required: CONFIG.consumerNeed.requiredSatisfaction,
    surplus: money(surplus),
    reinvested: money(h.reinvested),
    consumed: money(h.consumed),
    overtime: h.overtimeCount,
    strikes: h.strikes,
    raises: h.raises,
    teamBuildings: h.teamBuildings,
    rate,
    level: s.machineLevel,
    machineCost: money(s.machineCost),
    depreciation: money(s.machineCost / CONFIG.machine.lifeTurns),
    machineShare,
    organic,
    opened: h.factoriesOpened,
    acquired: h.factoriesAcquired,
    laidOff: h.laidOff,
    cheap: h.cheapHired,
  }
  const say = (template: string) => fill(template, vars)

  // 1. Bản chất tích lũy
  const essence: AnalysisItem[] = []
  if (surplus <= 0) {
    essence.push({ text: say(a.essence.none) })
  } else {
    essence.push({ text: say(a.essence.summary) })
    const tone = reinvestShare >= 0.85 ? a.essence.high : reinvestShare >= 0.5 ? a.essence.mixed : a.essence.low
    essence.push({ text: say(tone) })
  }

  // 2. Nhân tố ảnh hưởng
  const f = a.factors
  const exploitation =
    h.strikes > 0 || h.overtimeCount >= 3
      ? f.exploitationHigh
      : h.raises + h.teamBuildings >= 2
        ? f.exploitationSoft
        : f.exploitationMid
  const factors: AnalysisItem[] = [
    { label: f.exploitationLabel, text: say(exploitation) },
    { label: f.productivityLabel, text: say(s.machineLevel >= 3 ? f.productivityHigh : f.productivityLow) },
    { label: f.efficiencyLabel, text: say(s.machineCost > 0 ? f.efficiency : f.efficiencyNone) },
    { label: f.scaleLabel, text: say(f.scale[s.tierId]) },
  ]

  // 3. Hệ quả
  const q = a.consequences
  const concentration =
    h.factoriesOpened > 0 && h.factoriesAcquired > 0
      ? q.concentrationBoth
      : h.factoriesOpened > 0
        ? q.concentrationOwn
        : h.factoriesAcquired > 0
          ? q.concentrationRival
          : q.concentrationNone
  const reserve =
    h.laidOff > 0 && h.cheapHired > 0
      ? q.reserveBoth
      : h.laidOff > 0
        ? q.reserveLaidOff
        : h.cheapHired > 0
          ? q.reserveCheap
          : q.reserveNone
  const consequences: AnalysisItem[] = [
    { label: q.organicLabel, text: say(machineShare >= 30 ? q.organicHigh : q.organicLow) },
    { label: q.concentrationLabel, text: say(concentration) },
    { label: q.reserveLabel, text: say(reserve) },
  ]

  const t = CONFIG.text.end
  return {
    verdict:
      outcome === 'timeout' && totalCapital(s) >= target(s) && consumerNeed < CONFIG.consumerNeed.requiredSatisfaction
        ? say(CONFIG.text.result.timeoutNeed)
        : say(a.verdict[outcome]),
    groups: [
      { title: t.group1, items: essence },
      { title: t.group2, items: factors },
      { title: t.group3, items: consequences },
    ],
  }
}
