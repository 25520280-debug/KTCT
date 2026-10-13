import { CONFIG, type AllocationId, type Tier, type TierId } from '../config'
import { fill, money } from './format'
import type {
  EventInstance,
  EventOffer,
  EventType,
  Forecast,
  GameState,
  Projection,
  Rng,
  TurnResult,
} from './types'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const randomInt = (rng: Rng, min: number, max: number) => min + Math.floor(rng() * (max - min + 1))

// ---------- Khởi tạo ----------

function buildSchedule(rng: Rng): Record<number, EventInstance> {
  const { events, totalTurns } = CONFIG
  const schedule: Record<number, EventInstance> = {}
  const counts: Record<EventType, number> = { unemployment: 0, machine: 0, welfare: 0, rival: 0 }
  const welfare = (): EventInstance => ({ type: 'welfare', variant: rng() < 0.5 ? 'teamBuilding' : 'leave' })

  // Hai sự kiện bắt buộc xuất hiện ít nhất 1 lần mỗi ván.
  const [uMin, uMax] = events.unemployment.guaranteedTurns
  schedule[randomInt(rng, uMin, uMax)] = { type: 'unemployment' }
  counts.unemployment = 1
  const [mMin, mMax] = events.machine.guaranteedTurns
  schedule[randomInt(rng, mMin, mMax)] = { type: 'machine' }
  counts.machine = 1

  const pool: EventType[] = ['unemployment', 'machine', 'welfare', 'rival']
  for (let turn = 2; turn <= totalTurns; turn++) {
    if (schedule[turn] || rng() >= events.randomChance) continue
    const open = pool.filter((type) => counts[type] < events[type].maxCount && events[type].weight > 0)
    const total = open.reduce((sum, type) => sum + events[type].weight, 0)
    if (total <= 0) continue
    let roll = rng() * total
    const picked = open.find((type) => (roll -= events[type].weight) < 0) ?? open[open.length - 1]
    counts[picked]++
    schedule[turn] = picked === 'welfare' ? welfare() : { type: picked }
  }
  return schedule
}

export function getTier(id: TierId): Tier {
  return CONFIG.tiers.find((tier) => tier.id === id)!
}

export function createGame(tierId: TierId, rng: Rng = Math.random): GameState {
  return {
    tierId,
    turn: 1,
    phase: 'plan',
    cash: getTier(tierId).capital,
    workers: 0,
    cheapWorkers: 0,
    prepaidWages: 0,
    wage: CONFIG.worker.baseWage,
    machineLevel: 0,
    newGenMachines: 0,
    machineValue: 0,
    machineCost: 0,
    factories: 1,
    factoryValue: 0,
    satisfaction: CONFIG.satisfaction.start,
    overtime: false,
    leaveThisTurn: false,
    usedTeamBuilding: false,
    usedRaise: false,
    lastTurnStrike: false,
    schedule: buildSchedule(rng),
    pendingEvent: null,
    lastResult: null,
    pendingOutcome: null,
    outcome: null,
    history: {
      turns: [],
      events: [],
      machineSpend: 0,
      laborSpend: 0,
      factoriesOpened: 0,
      factoriesAcquired: 0,
      overtimeCount: 0,
      strikes: 0,
      raises: 0,
      teamBuildings: 0,
      reinvested: 0,
      consumed: 0,
      laidOff: 0,
      cheapHired: 0,
    },
  }
}

// ---------- Số liệu suy ra ----------

export const capacity = (s: GameState) => s.factories * CONFIG.factory.capacity
export const totalCapital = (s: GameState) => s.cash + s.machineValue + s.factoryValue
export const target = (s: GameState) => getTier(s.tierId).target
export const consumerSpendForFullSatisfaction = (s: GameState) =>
  Math.max(1, (target(s) - getTier(s.tierId).capital) * CONFIG.consumerNeed.spendForFullSatisfaction)
export const consumerSatisfaction = (s: GameState) =>
  Math.min(100, Math.floor((s.history.consumed / consumerSpendForFullSatisfaction(s)) * 100))
export const consumerSatisfactionAfter = (s: GameState, additionalSpend: number) =>
  Math.min(
    100,
    Math.floor(((s.history.consumed + additionalSpend) / consumerSpendForFullSatisfaction(s)) * 100),
  )

// Năng suất lao động: cùng số công nhân, máy tốt hơn thì sản lượng cao hơn.
export const productivity = (s: GameState) =>
  1 +
  s.machineLevel * CONFIG.machine.productivityPerLevel +
  s.newGenMachines * CONFIG.events.machine.productivityBonus

export const cheapWage = (s: GameState) => Math.round(s.wage * CONFIG.events.unemployment.wageFactor)
export const wageBill = (s: GameState) =>
  (s.workers - s.cheapWorkers) * s.wage + s.cheapWorkers * cheapWage(s)

export function project(s: GameState, overtime: boolean = s.overtime): Projection {
  const { worker, machine, satisfaction, events } = CONFIG
  const intensity =
    (overtime ? CONFIG.overtime.outputMult : 1) * (s.leaveThisTurn ? events.welfare.leaveOutputFactor : 1)
  const revenue = Math.round(s.workers * worker.outputValue * productivity(s) * intensity)
  const materials = Math.round(revenue * worker.materialRate)
  // Máy chỉ chuyển MỘT PHẦN giá trị vào sản phẩm mỗi chu kỳ.
  const depreciation = Math.min(s.machineValue, Math.round(s.machineCost / machine.lifeTurns))
  const v = wageBill(s)
  const c = materials + depreciation
  const advance = materials + Math.max(0, v - s.prepaidWages)
  const satisfactionAfter = clamp(
    s.satisfaction + (overtime ? satisfaction.overtime : satisfaction.drift),
    0,
    100,
  )
  return {
    revenue,
    materials,
    depreciation,
    c,
    v,
    m: revenue - c - v,
    advance,
    canAfford: s.cash >= advance,
    satisfactionAfter,
    willStrike: s.workers > 0 && satisfactionAfter <= 0,
  }
}

// ---------- Thao tác trong chu kỳ ----------

export function maxHire(s: GameState): number {
  let count = 0
  while (s.workers + count < capacity(s)) {
    const added = count + 1
    const wages = added * s.wage
    const candidate = {
      ...s,
      cash: s.cash - wages,
      workers: s.workers + added,
      prepaidWages: s.prepaidWages + wages,
    }
    if (wages > s.cash || !project(candidate).canAfford) break
    count++
  }
  return count
}

export function hire(s: GameState, amount: number): GameState {
  const count = Math.min(amount, maxHire(s))
  if (count <= 0) return s
  const wages = count * s.wage
  return {
    ...s,
    cash: s.cash - wages,
    workers: s.workers + count,
    prepaidWages: s.prepaidWages + wages,
  }
}

export function upgradeCost(s: GameState): number | null {
  return s.machineLevel < CONFIG.machine.maxLevel ? CONFIG.machine.upgradeCost[s.machineLevel] : null
}

export function upgradeMachine(s: GameState): GameState {
  const cost = upgradeCost(s)
  if (cost === null || s.cash < cost) return s
  return {
    ...s,
    cash: s.cash - cost,
    machineLevel: s.machineLevel + 1,
    machineValue: s.machineValue + cost,
    machineCost: s.machineCost + cost,
    history: { ...s.history, machineSpend: s.history.machineSpend + cost },
  }
}

export function factoryCost(s: GameState): number | null {
  return s.factories < CONFIG.factory.max ? CONFIG.factory.cost[s.factories] : null
}

export function openFactory(s: GameState): GameState {
  const cost = factoryCost(s)
  if (cost === null || s.cash < cost) return s
  return {
    ...s,
    cash: s.cash - cost,
    factories: s.factories + 1,
    factoryValue: s.factoryValue + cost,
    history: { ...s.history, factoriesOpened: s.history.factoriesOpened + 1 },
  }
}

export function teamBuildingCost(s: GameState): number {
  return Math.max(CONFIG.teamBuilding.minCost, s.workers * CONFIG.teamBuilding.costPerWorker)
}

export function teamBuilding(s: GameState): GameState {
  const cost = teamBuildingCost(s)
  if (s.usedTeamBuilding || s.workers === 0 || s.cash < cost) return s
  return {
    ...s,
    cash: s.cash - cost,
    satisfaction: clamp(s.satisfaction + CONFIG.teamBuilding.gain, 0, 100),
    usedTeamBuilding: true,
    history: { ...s.history, teamBuildings: s.history.teamBuildings + 1 },
  }
}

export function raiseWage(s: GameState): GameState {
  if (s.usedRaise || s.workers === 0) return s
  return {
    ...s,
    wage: Math.round(s.wage * (1 + CONFIG.raise.pct)),
    satisfaction: clamp(s.satisfaction + CONFIG.raise.gain, 0, 100),
    usedRaise: true,
    history: { ...s.history, raises: s.history.raises + 1 },
  }
}

// Tăng ca cần thêm nguyên liệu: chỉ bật được khi đủ tiền ứng trước.
export function canToggleOvertime(s: GameState): boolean {
  return s.overtime || !project(s).canAfford || project(s, true).canAfford
}

export function toggleOvertime(s: GameState): GameState {
  return canToggleOvertime(s) ? { ...s, overtime: !s.overtime } : s
}

// Sau khi mua món này, tiền còn lại có đủ ứng trước cho chu kỳ không?
export function leavesEnoughCash(before: GameState, after: GameState): boolean {
  return after === before || project(after).canAfford
}

// ---------- Dự báo bằng luật có sẵn ----------

export function forecast(s: GameState): Forecast {
  const t = CONFIG.text.forecast
  if (s.workers === 0) return { level: 'info', text: t.idle }
  const p = project(s)
  if (p.willStrike) {
    return { level: 'danger', text: s.lastTurnStrike ? t.strikeSecond : t.strikeNow }
  }
  if (!p.canAfford) {
    return { level: 'danger', text: fill(t.bankrupt, { missing: money(p.advance - s.cash) }) }
  }
  const low = CONFIG.satisfaction.lowThreshold
  if (s.overtime) {
    const base = project(s, false)
    const pct = base.m > 0 ? Math.round(((p.m - base.m) / base.m) * 100) : 0
    const template = p.satisfactionAfter < low ? t.overtimeHigh : t.overtime
    return { level: 'warn', text: fill(template, { pct, sat: p.satisfactionAfter }) }
  }
  if (s.satisfaction < low) return { level: 'warn', text: fill(t.low, { sat: s.satisfaction }) }
  return { level: 'info', text: fill(t.ok, { m: money(p.m) }) }
}

// ---------- Sản xuất ----------

export function produce(s: GameState): GameState {
  if (s.phase !== 'plan' || s.workers === 0) return s
  const p = project(s)
  const base: TurnResult = {
    turn: s.turn,
    revenue: 0,
    materials: 0,
    depreciation: p.depreciation,
    c: p.depreciation,
    v: 0,
    m: 0,
    overtime: s.overtime,
    strike: false,
    bankrupt: false,
    cashBefore: s.cash,
    advance: p.advance,
  }

  if (p.willStrike) {
    // Đình công: không có sản phẩm, vẫn trả một phần lương, máy vẫn hao mòn.
    const cost = Math.round(p.v * CONFIG.strike.wageCostRate)
    const advance = Math.max(0, cost - s.prepaidWages)
    const result: TurnResult = { ...base, v: cost, m: -(cost + p.depreciation), strike: true, advance }
    if (s.cash + s.prepaidWages < cost) {
      return { ...s, phase: 'result', lastResult: { ...result, bankrupt: true }, pendingOutcome: 'bankrupt' }
    }
    return {
      ...s,
      phase: 'result',
      cash: s.cash + s.prepaidWages - cost,
      machineValue: s.machineValue - p.depreciation,
      satisfaction: CONFIG.satisfaction.afterStrike,
      lastTurnStrike: true,
      lastResult: result,
      pendingOutcome: s.lastTurnStrike ? 'strike' : null,
      history: {
        ...s.history,
        strikes: s.history.strikes + 1,
        laborSpend: s.history.laborSpend + cost,
      },
    }
  }

  if (!p.canAfford) {
    return { ...s, phase: 'result', lastResult: { ...base, bankrupt: true }, pendingOutcome: 'bankrupt' }
  }

  return {
    ...s,
    phase: 'result',
    // Thu doanh thu, trả nguyên liệu và lương. Khấu hao không tốn tiền mặt mà trừ vào giá trị máy.
    cash: s.cash + p.revenue - p.materials - Math.max(0, p.v - s.prepaidWages),
    machineValue: s.machineValue - p.depreciation,
    satisfaction: p.satisfactionAfter,
    lastTurnStrike: false,
    lastResult: { ...base, revenue: p.revenue, materials: p.materials, c: p.c, v: p.v, m: p.m },
    history: {
      ...s.history,
      overtimeCount: s.history.overtimeCount + (s.overtime ? 1 : 0),
      laborSpend: s.history.laborSpend + p.v,
    },
  }
}

// ---------- Phân bổ m và sang chu kỳ sau ----------

function eventIsValid(s: GameState, event: EventInstance): boolean {
  if (event.type === 'rival') return s.factories < CONFIG.factory.max
  if (event.type === 'welfare' || event.type === 'machine') return s.workers > 0
  return true
}

export function allocate(s: GameState, allocationId: AllocationId): GameState {
  const result = s.lastResult
  if (s.phase !== 'result' || !result) return s
  if (s.pendingOutcome) return { ...s, phase: 'ended', outcome: s.pendingOutcome }

  const hasSurplus = result.m > 0
  const share = CONFIG.allocations.find((a) => a.id === allocationId)!.reinvest
  const consumed = hasSurplus ? Math.round(result.m * (1 - share)) : 0
  const reinvested = hasSurplus ? result.m - consumed : 0
  const next: GameState = {
    ...s,
    cash: s.cash - consumed,
    prepaidWages: 0,
    history: {
      ...s.history,
      reinvested: s.history.reinvested + reinvested,
      consumed: s.history.consumed + consumed,
      turns: [
        ...s.history.turns,
        {
          turn: result.turn,
          c: result.c,
          v: result.v,
          m: result.m,
          overtime: result.overtime,
          strike: result.strike,
          allocation: hasSurplus ? allocationId : null,
          reinvested,
          consumed,
        },
      ],
    },
  }

  if (
    totalCapital(next) >= target(next) &&
    consumerSatisfaction(next) >= CONFIG.consumerNeed.requiredSatisfaction
  ) {
    return { ...next, phase: 'ended', outcome: 'win' }
  }
  if (next.turn >= CONFIG.totalTurns) return { ...next, phase: 'ended', outcome: 'timeout' }

  const turn = next.turn + 1
  const scheduled = next.schedule[turn]
  const event = scheduled && eventIsValid(next, scheduled) ? scheduled : null
  return {
    ...next,
    turn,
    phase: event ? 'event' : 'plan',
    pendingEvent: event,
    overtime: false,
    leaveThisTurn: false,
    usedTeamBuilding: false,
    usedRaise: false,
  }
}

// ---------- Sự kiện ----------

function unemploymentGroup(s: GameState) {
  const cfg = CONFIG.events.unemployment
  const count = clamp(Math.round(s.workers * cfg.groupShare), cfg.groupMin, cfg.groupMax)
  let added = Math.min(count, capacity(s) - s.workers)
  // Người mới cần thêm nguyên liệu: chỉ nhận thêm số người mà tiền ứng trước kham nổi.
  const affordable = (extra: number) =>
    project({ ...s, workers: s.workers + extra, cheapWorkers: s.cheapWorkers + extra }).canAfford
  while (added > 0 && !affordable(added)) added--
  // Hết chỗ hoặc hết tiền thì người thất nghiệp thay thế công nhân lương cũ.
  const replaced = Math.min(count - added, s.workers - s.cheapWorkers)
  return { added, replaced, count: added + replaced, wanted: count }
}

const machineLayoff = (s: GameState) =>
  s.workers > 1 ? Math.round(s.workers * CONFIG.events.machine.layoffShare) : 0

function rawOffer(s: GameState): EventOffer | null {
  const event = s.pendingEvent
  if (!event) return null
  const cfg = CONFIG.events
  switch (event.type) {
    case 'unemployment': {
      const group = unemploymentGroup(s)
      return {
        event,
        cost: 0,
        canAccept: group.count > 0,
        vars: {
          count: group.count || group.wanted,
          replace: group.replaced,
          wage: money(cheapWage(s)),
          normalWage: money(s.wage),
          sat: cfg.unemployment.satisfaction,
        },
      }
    }
    case 'machine': {
      const cost = cfg.machine.cost
      return {
        event,
        cost,
        canAccept: s.cash >= cost,
        vars: {
          cost: money(cost),
          pct: Math.round((cfg.machine.productivityBonus / productivity(s)) * 100),
          fired: machineLayoff(s),
          workers: s.workers,
          sat: cfg.machine.satisfaction,
        },
      }
    }
    case 'welfare': {
      const isTeamBuilding = event.variant === 'teamBuilding'
      const cost = isTeamBuilding ? teamBuildingCost(s) : 0
      return {
        event,
        cost,
        canAccept: s.cash >= cost,
        vars: {
          cost: money(cost),
          gain: isTeamBuilding ? cfg.welfare.gainTeamBuilding : cfg.welfare.gainLeave,
          loss: cfg.welfare.refuse,
          pct: Math.round((1 - cfg.welfare.leaveOutputFactor) * 100),
        },
      }
    }
    case 'rival': {
      const fullCost = factoryCost(s) ?? 0
      const cost = Math.round(fullCost * cfg.rival.priceFactor)
      return {
        event,
        cost,
        canAccept: s.cash >= cost,
        vars: { cost: money(cost), fullCost: money(fullCost), capacity: CONFIG.factory.capacity },
      }
    }
  }
}

// Không cho nhận lời nếu sau đó thiếu tiền ứng trước, tránh phá sản oan vì một sự kiện.
export function eventOffer(s: GameState): EventOffer | null {
  const offer = rawOffer(s)
  if (!offer || !offer.canAccept) return offer
  const after = applyEvent(s, offer, true)
  return { ...offer, canAccept: after.workers === 0 || !project(s).canAfford || project(after).canAfford }
}

export function resolveEvent(s: GameState, wantAccept: boolean): GameState {
  const offer = eventOffer(s)
  if (s.phase !== 'event' || !offer) return s
  return applyEvent(s, offer, wantAccept && offer.canAccept)
}

function applyEvent(s: GameState, offer: EventOffer, accepted: boolean): GameState {
  const { event } = offer
  const cfg = CONFIG.events
  let next: GameState = {
    ...s,
    phase: 'plan',
    pendingEvent: null,
    history: {
      ...s.history,
      events: [...s.history.events, { turn: s.turn, type: event.type, variant: event.variant, accepted }],
    },
  }
  const addSatisfaction = (delta: number) => {
    next = { ...next, satisfaction: clamp(next.satisfaction + delta, 0, 100) }
  }

  if (event.type === 'unemployment' && accepted) {
    const group = unemploymentGroup(s)
    next = {
      ...next,
      workers: s.workers + group.added,
      cheapWorkers: s.cheapWorkers + group.count,
      history: { ...next.history, cheapHired: next.history.cheapHired + group.count },
    }
    if (s.workers > 0) addSatisfaction(cfg.unemployment.satisfaction)
  }

  if (event.type === 'machine' && accepted) {
    const fired = machineLayoff(s)
    // Giữ lại nhóm lương thấp, sa thải công nhân lương cũ trước.
    const firedCheap = Math.max(0, fired - (s.workers - s.cheapWorkers))
    next = {
      ...next,
      cash: s.cash - offer.cost,
      newGenMachines: s.newGenMachines + 1,
      machineValue: s.machineValue + offer.cost,
      machineCost: s.machineCost + offer.cost,
      workers: s.workers - fired,
      cheapWorkers: s.cheapWorkers - firedCheap,
      history: {
        ...next.history,
        machineSpend: next.history.machineSpend + offer.cost,
        laidOff: next.history.laidOff + fired,
      },
    }
    addSatisfaction(cfg.machine.satisfaction)
  }

  if (event.type === 'welfare') {
    if (!accepted) addSatisfaction(cfg.welfare.refuse)
    else if (event.variant === 'teamBuilding') {
      next = { ...next, cash: s.cash - offer.cost }
      addSatisfaction(cfg.welfare.gainTeamBuilding)
    } else {
      next = { ...next, leaveThisTurn: true }
      addSatisfaction(cfg.welfare.gainLeave)
    }
  }

  if (event.type === 'rival' && accepted) {
    next = {
      ...next,
      cash: s.cash - offer.cost,
      factories: s.factories + 1,
      factoryValue: s.factoryValue + offer.cost,
      history: { ...next.history, factoriesAcquired: next.history.factoriesAcquired + 1 },
    }
  }

  return next
}

// ---------- Cổng vào duy nhất cho giao diện: state + hành động -> state mới ----------

export type Action =
  | { type: 'hire'; amount: number }
  | { type: 'upgradeMachine' }
  | { type: 'openFactory' }
  | { type: 'teamBuilding' }
  | { type: 'raiseWage' }
  | { type: 'toggleOvertime' }
  | { type: 'produce' }
  | { type: 'allocate'; allocation: AllocationId }
  | { type: 'resolveEvent'; accept: boolean }

export function step(s: GameState, action: Action): GameState {
  // Thuê người, mua sắm, sản xuất chỉ làm được trong pha lập kế hoạch.
  if (action.type !== 'allocate' && action.type !== 'resolveEvent' && s.phase !== 'plan') return s
  switch (action.type) {
    case 'hire':
      return hire(s, action.amount)
    case 'upgradeMachine':
      return upgradeMachine(s)
    case 'openFactory':
      return openFactory(s)
    case 'teamBuilding':
      return teamBuilding(s)
    case 'raiseWage':
      return raiseWage(s)
    case 'toggleOvertime':
      return toggleOvertime(s)
    case 'produce':
      return produce(s)
    case 'allocate':
      return allocate(s, action.allocation)
    case 'resolveEvent':
      return resolveEvent(s, action.accept)
  }
}
