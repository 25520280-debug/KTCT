import type { AllocationId, TierId } from '../config'

export type Rng = () => number

export type EventType = 'unemployment' | 'machine' | 'welfare' | 'rival'
export type WelfareVariant = 'teamBuilding' | 'leave'

export interface EventInstance {
  type: EventType
  variant?: WelfareVariant
}

export type Phase = 'event' | 'plan' | 'result' | 'ended'
export type Outcome = 'win' | 'strike' | 'bankrupt' | 'timeout'

export interface TurnResult {
  turn: number
  revenue: number
  materials: number
  depreciation: number
  c: number
  v: number
  m: number
  overtime: boolean
  strike: boolean
  bankrupt: boolean
  cashBefore: number
  advance: number
}

export interface TurnRecord {
  turn: number
  c: number
  v: number
  m: number
  overtime: boolean
  strike: boolean
  allocation: AllocationId | null
  reinvested: number
  consumed: number
}

export interface EventRecord {
  turn: number
  type: EventType
  variant?: WelfareVariant
  accepted: boolean
}

export interface History {
  turns: TurnRecord[]
  events: EventRecord[]
  machineSpend: number
  laborSpend: number
  factoriesOpened: number
  factoriesAcquired: number
  overtimeCount: number
  strikes: number
  raises: number
  teamBuildings: number
  reinvested: number
  consumed: number
  laidOff: number
  cheapHired: number
}

export interface GameState {
  tierId: TierId
  turn: number
  phase: Phase
  cash: number
  workers: number // tổng số công nhân, gồm cả nhóm lương thấp
  cheapWorkers: number // số công nhân nhận từ sự kiện thất nghiệp
  prepaidWages: number // tiền lương đã ứng khi thuê người trong chu kỳ hiện tại
  wage: number
  machineLevel: number
  newGenMachines: number
  machineValue: number // giá trị máy còn lại, giảm dần theo khấu hao
  machineCost: number // tổng giá mua máy, làm cơ sở tính khấu hao
  factories: number
  factoryValue: number
  satisfaction: number
  overtime: boolean
  leaveThisTurn: boolean
  usedTeamBuilding: boolean
  usedRaise: boolean
  lastTurnStrike: boolean
  schedule: Record<number, EventInstance>
  pendingEvent: EventInstance | null
  lastResult: TurnResult | null
  pendingOutcome: Outcome | null
  outcome: Outcome | null
  history: History
}

export interface Projection {
  revenue: number
  materials: number
  depreciation: number
  c: number
  v: number
  m: number
  advance: number
  canAfford: boolean
  satisfactionAfter: number
  willStrike: boolean
}

export interface EventOffer {
  event: EventInstance
  cost: number
  canAccept: boolean
  vars: Record<string, string | number>
}

export type ForecastLevel = 'danger' | 'warn' | 'info'

export interface Forecast {
  level: ForecastLevel
  text: string
}
