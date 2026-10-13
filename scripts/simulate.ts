// Mô phỏng cân bằng: `npm run simulate` (thêm số ván ở cuối, ví dụ `npm run simulate -- 1000`).
import { CONFIG, type AllocationId, type TierId } from '../src/config'
import * as G from '../src/engine/engine'
import type { GameState, Rng } from '../src/engine/types'

interface Strategy {
  name: string
  priority: 'machine' | 'labor'
  alwaysOvertime: boolean
  careForWorkers: boolean
  allocation: AllocationId
}

const STRATEGIES: Strategy[] = [
  { name: '(a) Tái đầu tư hết, ưu tiên máy', priority: 'machine', alwaysOvertime: false, careForWorkers: true, allocation: 'all' },
  { name: '(b) Tái đầu tư hết, ưu tiên nhân công', priority: 'labor', alwaysOvertime: false, careForWorkers: true, allocation: 'all' },
  { name: '(c) Ép tăng ca liên tục', priority: 'machine', alwaysOvertime: true, careForWorkers: false, allocation: 'all' },
  { name: '(d) Chia đều tiêu dùng/đầu tư', priority: 'machine', alwaysOvertime: false, careForWorkers: true, allocation: 'balanced' },
  { name: '(e) Tiêu dùng nhiều (70%)', priority: 'machine', alwaysOvertime: false, careForWorkers: true, allocation: 'low' },
  { name: '(f) Tái đầu tư 70%, ưu tiên máy', priority: 'machine', alwaysOvertime: false, careForWorkers: true, allocation: 'high' },
]

function mulberry32(seed: number): Rng {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Chỉ mua khi tiền còn lại vẫn đủ ứng trước cho chu kỳ.
function tryBuy(s: GameState, action: (state: GameState) => GameState): GameState {
  const after = action(s)
  return after !== s && G.project(after).canAfford ? after : s
}

function plan(s: GameState, strategy: Strategy): GameState {
  const hireAll = (state: GameState) => G.hire(state, G.capacity(state))
  const buyMachines = (state: GameState) => {
    for (;;) {
      const after = tryBuy(state, G.upgradeMachine)
      if (after === state) return state
      state = after
    }
  }
  const expand = (state: GameState) => {
    for (;;) {
      if (state.workers < G.capacity(state)) return state
      const after = tryBuy(state, G.openFactory)
      if (after === state) return state
      state = hireAll(after)
    }
  }

  if (strategy.alwaysOvertime) s = { ...s, overtime: true }
  if (s.workers === 0) s = hireAll(s)
  if (strategy.priority === 'machine') {
    s = expand(hireAll(buyMachines(s)))
  } else {
    s = buyMachines(expand(hireAll(s)))
  }
  s = hireAll(s)

  if (strategy.careForWorkers && G.project(s).satisfactionAfter < CONFIG.satisfaction.lowThreshold) {
    s = tryBuy(s, G.teamBuilding)
    if (G.project(s).satisfactionAfter < CONFIG.satisfaction.lowThreshold) s = tryBuy(s, G.raiseWage)
  }
  return s
}

function decideEvent(s: GameState, strategy: Strategy): boolean {
  const offer = G.eventOffer(s)!
  if (!offer.canAccept) return false
  if (offer.event.type === 'welfare' && !strategy.careForWorkers) return false
  return G.project(G.resolveEvent(s, true)).canAfford
}

function playOne(tierId: TierId, strategy: Strategy, rng: Rng): GameState {
  let s = G.createGame(tierId, rng)
  while (s.phase !== 'ended') {
    if (s.phase === 'event') s = G.resolveEvent(s, decideEvent(s, strategy))
    else if (s.phase === 'plan') s = G.produce(plan(s, strategy))
    else s = G.allocate(s, strategy.allocation)
  }
  return s
}

// `npm run simulate -- curve`: bỏ mục tiêu, in tư bản trung vị theo từng chu kỳ để chọn mốc thắng.
if (process.argv[2] === 'curve') {
  for (const tier of CONFIG.tiers) {
    tier.target = Infinity
    console.log(`== ${tier.name} ==`)
    for (const strategy of STRATEGIES) {
      const rng = mulberry32(12345)
      const runs = Array.from({ length: 300 }, () => playOne(tier.id, strategy, rng))
      const curve = Array.from({ length: CONFIG.totalTurns }, (_, i) => {
        let capital = tier.capital
        const perRun = runs.map((run) => {
          let total = tier.capital
          for (const t of run.history.turns) if (t.turn <= i + 1) total += t.m - t.consumed
          return total
        })
        capital = [...perRun].sort((a, b) => a - b)[150]
        return Math.round(capital)
      })
      console.log(`${strategy.name.slice(0, 3)} ${curve.join('  ')}`)
    }
  }
  process.exit(0)
}

const games = Number(process.argv[2]) || 300
const pad = (text: string | number, width: number) => String(text).padEnd(width)
const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]

console.log(
  `Mô phỏng ${games} ván cho mỗi ô. Thắng cần đủ vốn và thỏa mãn tiêu dùng ${CONFIG.consumerNeed.requiredSatisfaction}%. ` +
    `Mục tiêu vốn: ${CONFIG.tiers.map((t) => `${t.name} $${t.target}`).join(', ')}\n`,
)
for (const tier of CONFIG.tiers) {
  console.log(`== ${tier.name} (vốn $${tier.capital}, mục tiêu $${tier.target}) ==`)
  console.log(
    `${pad('Chiến thuật', 40)}${pad('Thắng', 8)}${pad('Nhu cầu đạt', 12)}${pad('Lượt thắng', 12)}${pad('Đình công', 11)}${pad('Phá sản', 9)}${pad('Hết lượt', 10)}${pad('Tư bản cuối', 14)}${pad('Chi tiêu', 14)}Tái đầu tư`,
  )
  for (const strategy of STRATEGIES) {
    const rng = mulberry32(12345)
    const results = Array.from({ length: games }, () => playOne(tier.id, strategy, rng))
    const count = (outcome: string) => results.filter((r) => r.outcome === outcome).length
    const share = (outcome: string) => `${Math.round((count(outcome) / games) * 100)}%`
    const needMet = results.filter((r) => G.consumerSatisfaction(r) >= CONFIG.consumerNeed.requiredSatisfaction).length
    const winTurns = results.filter((r) => r.outcome === 'win').map((r) => r.turn)
    console.log(
      pad(strategy.name, 40) +
        pad(share('win'), 8) +
      pad(`${Math.round((needMet / games) * 100)}%`, 12) +
        pad(winTurns.length ? `${median(winTurns)} (${Math.min(...winTurns)}-${Math.max(...winTurns)})` : '—', 12) +
        pad(share('strike'), 11) +
        pad(share('bankrupt'), 9) +
        pad(share('timeout'), 10) +
        pad(`$${Math.round(median(results.map(G.totalCapital)))}`, 14) +
        pad(`$${Math.round(median(results.map((r) => r.history.consumed)))}`, 14) +
        `$${Math.round(median(results.map((r) => r.history.reinvested)))}`,
    )
  }
  console.log('')
}
