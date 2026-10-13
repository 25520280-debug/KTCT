import Phaser from 'phaser'
import {
  GATE,
  OBSTACLES,
  PLAYER_SPEED,
  PLAYER_START,
  ROOMS,
  WALL,
  ZONES,
  ZONE_RADIUS,
  roomConveyor,
  workerSpot,
  type Rect,
  type ZoneId,
} from './layout'
import { COLOR, createTextures, workerKey, type Mood } from './textures'

// Những gì thế giới 2D cần biết để vẽ. Lớp React tính ra từ state của engine.
export interface WorldView {
  workers: number
  cheapWorkers: number
  factories: number
  machineLevel: number
  newGenMachines: number
  mood: Exclude<Mood, 'idle'>
  overtime: boolean
  locked: boolean // đang mở menu hoặc popup: nhân vật đứng yên
  visualEffect: { id: number; kind: 'machine' | 'factory' } | null
  productionEffect: { id: number; wages: number[]; surplus: number } | null
  mode: 'idle' | 'producing' | 'strike'
  crowd: boolean // đám người thất nghiệp trước cổng
  surplusWaiting: boolean // m đang chờ phân bổ ở két sắt
  tutorialTarget: ZoneId | null
}

export interface WorldCallbacks {
  onNear: (zone: ZoneId | null) => void
  onInteract: (zone: ZoneId) => void
  onCameraTransform: (transform: CameraTransform) => void
}

export interface CameraTransform {
  x: number
  y: number
  scale: number
}

interface WorkerSprite {
  body: Phaser.GameObjects.Image
  banner: Phaser.GameObjects.Image
  baseY: number
  phase: number
}

interface RoutePoint {
  x: number
  y: number
}

const PRODUCE_BOX_INTERVAL = 260
const CASH_HUD = { x: 300, y: 40 } // tiền bay về ô Tiền mặt trên HUD
const ROUTE_ORIGIN = { x: 40, y: 100 }
const ROUTE_STEP = 20
const ROUTE_COLUMNS = 29
const ROUTE_ROWS = 30

function routePoint(index: number): RoutePoint {
  return {
    x: ROUTE_ORIGIN.x + (index % ROUTE_COLUMNS) * ROUTE_STEP,
    y: ROUTE_ORIGIN.y + Math.floor(index / ROUTE_COLUMNS) * ROUTE_STEP,
  }
}

function routeIndex(x: number, y: number): number {
  const col = Math.max(0, Math.min(ROUTE_COLUMNS - 1, Math.round((x - ROUTE_ORIGIN.x) / ROUTE_STEP)))
  const row = Math.max(0, Math.min(ROUTE_ROWS - 1, Math.round((y - ROUTE_ORIGIN.y) / ROUTE_STEP)))
  return row * ROUTE_COLUMNS + col
}

function findRoute(start: RoutePoint, destination: RoutePoint): RoutePoint[] {
  const obstacles = Object.values(OBSTACLES)
  const walkable = (point: RoutePoint) =>
    point.x >= 32 &&
    point.x <= 608 &&
    point.y >= 96 &&
    point.y <= 688 &&
    !obstacles.some(
      (rect) =>
        point.x >= rect.x - 16 &&
        point.x <= rect.x + rect.w + 16 &&
        point.y >= rect.y - 16 &&
        point.y <= rect.y + rect.h + 16,
    )

  const startIndex = routeIndex(start.x, start.y)
  const startPoint = routePoint(startIndex)
  let goalIndex = -1
  let goalDistance = Infinity
  for (let index = 0; index < ROUTE_COLUMNS * ROUTE_ROWS; index++) {
    const point = routePoint(index)
    const distance = Math.hypot(point.x - destination.x, point.y - destination.y)
    if (distance < goalDistance && distance <= 100 && walkable(point)) {
      goalIndex = index
      goalDistance = distance
    }
  }
  if (goalIndex < 0) return []

  const count = ROUTE_COLUMNS * ROUTE_ROWS
  const costs = new Float64Array(count).fill(Infinity)
  const estimates = new Float64Array(count).fill(Infinity)
  const previous = new Int32Array(count).fill(-1)
  const closed = new Uint8Array(count)
  const open = [startIndex]
  costs[startIndex] = 0

  const heuristic = (point: RoutePoint) => {
    const dx = Math.abs(point.x - routePoint(goalIndex).x) / ROUTE_STEP
    const dy = Math.abs(point.y - routePoint(goalIndex).y) / ROUTE_STEP
    return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy)
  }
  estimates[startIndex] = heuristic(startPoint)

  while (open.length > 0) {
    let bestAt = 0
    for (let i = 1; i < open.length; i++) {
      if (estimates[open[i]] < estimates[open[bestAt]]) bestAt = i
    }
    const current = open.splice(bestAt, 1)[0]
    if (current === goalIndex) break
    if (closed[current]) continue
    closed[current] = 1

    const col = current % ROUTE_COLUMNS
    const row = Math.floor(current / ROUTE_COLUMNS)
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue
        const nextCol = col + dx
        const nextRow = row + dy
        if (nextCol < 0 || nextCol >= ROUTE_COLUMNS || nextRow < 0 || nextRow >= ROUTE_ROWS) continue
        const next = nextRow * ROUTE_COLUMNS + nextCol
        if (closed[next]) continue
        const point = routePoint(next)
        if (!walkable(point)) continue
        if (dx !== 0 && dy !== 0) {
          if (!walkable(routePoint(row * ROUTE_COLUMNS + nextCol)) || !walkable(routePoint(nextRow * ROUTE_COLUMNS + col))) continue
        }
        const cost = costs[current] + (dx !== 0 && dy !== 0 ? Math.SQRT2 : 1)
        if (cost >= costs[next]) continue
        previous[next] = current
        costs[next] = cost
        estimates[next] = cost + heuristic(point)
        if (!open.includes(next)) open.push(next)
      }
    }
  }

  if (startIndex !== goalIndex && previous[goalIndex] < 0) return []
  const gridRoute: RoutePoint[] = []
  for (let index = goalIndex; index >= 0; index = previous[index]) {
    gridRoute.push(routePoint(index))
    if (index === startIndex) break
  }
  gridRoute.reverse()
  if (gridRoute.length <= 2) return [start, ...gridRoute]

  const clearLine = (from: RoutePoint, to: RoutePoint) => {
    const distance = Math.hypot(to.x - from.x, to.y - from.y)
    const samples = Math.ceil(distance / 8)
    for (let i = 1; i < samples; i++) {
      const ratio = i / samples
      if (!walkable({ x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio })) return false
    }
    return true
  }
  const smoothed = [start]
  let anchor = 0
  while (anchor < gridRoute.length - 1) {
    let furthest = gridRoute.length - 1
    while (furthest > anchor + 1 && !clearLine(gridRoute[anchor], gridRoute[furthest])) furthest--
    smoothed.push(gridRoute[furthest])
    anchor = furthest
  }
  return smoothed
}

export default class FactoryScene extends Phaser.Scene {
  private view: WorldView
  private callbacks: WorldCallbacks
  private drawn: WorldView | null = null
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  private keys!: Record<'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd', Phaser.Input.Keyboard.Key>
  private workers: WorkerSprite[] = []
  private workerFigures: Phaser.GameObjects.Text[] = []
  private belts: Phaser.GameObjects.TileSprite[] = []
  private lots!: Phaser.GameObjects.Graphics
  private machine!: Phaser.GameObjects.Graphics
  private overtimeTint!: Phaser.GameObjects.Graphics
  private tutorialRoute!: Phaser.GameObjects.Graphics
  private tutorialMarker!: Phaser.GameObjects.Image
  private tutorialArrow!: Phaser.GameObjects.Image
  private leverHandle!: Phaser.GameObjects.Rectangle
  private crowd: Phaser.GameObjects.Image[] = []
  private safeGlow!: Phaser.GameObjects.Arc
  private moveTarget!: Phaser.GameObjects.Image
  private safeCoins: Phaser.GameObjects.Image[] = []
  private boxTimer: Phaser.Time.TimerEvent | null = null
  private near: ZoneId | null = null
  private stepClock = 0
  private interactionTarget: ZoneId | null = null
  private movementPath: RoutePoint[] = []
  private effectResetTimer: Phaser.Time.TimerEvent | null = null
  private lastCameraEmit = 0
  private lastCameraTransform = { x: NaN, y: NaN, scale: NaN }
  private lastTutorialRouteKey = ''

  constructor(view: WorldView, callbacks: WorldCallbacks) {
    super('factory')
    this.view = view
    this.callbacks = callbacks
  }

  // React gọi mỗi khi state đổi.
  apply(view: WorldView) {
    this.view = view
    if (this.drawn) this.refresh()
  }

  create() {
    createTextures(this)
    this.drawStaticWorld()
    this.lots = this.add.graphics()
    this.overtimeTint = this.add.graphics()
    this.tutorialRoute = this.add.graphics().setDepth(2)
    this.tutorialMarker = this.add.image(0, 0, 'move-target').setVisible(false).setDepth(1400).setScale(0.55)
    this.tutorialArrow = this.add.image(0, 0, 'tutorial-arrow').setVisible(false).setDepth(1400).setScale(0.75)
    this.machine = this.add.graphics().setDepth(OBSTACLES.machine.y)

    for (let room = 0; room < ROOMS.length; room++) {
      const c = roomConveyor(room)
      this.belts.push(this.add.tileSprite(c.x, c.y, c.w, c.h, 'belt').setOrigin(0).setDepth(c.y))
    }

    const lever = OBSTACLES.lever
    this.leverHandle = this.add
      .rectangle(lever.x + lever.w / 2, lever.y + lever.h / 2, 8, 34, COLOR.red)
      .setStrokeStyle(2, COLOR.ink)
      .setOrigin(0.5, 1)
      .setAngle(-35)
      .setDepth(lever.y + 40)

    const safe = OBSTACLES.safe
    this.safeGlow = this.add.circle(safe.x + safe.w / 2, safe.y + safe.h / 2, 74).setStrokeStyle(6, COLOR.amber).setVisible(false)
    this.tweens.add({ targets: this.safeGlow, scale: 1.12, alpha: 0.35, duration: 600, yoyo: true, repeat: -1 })
    for (let i = 0; i < 5; i++) {
      this.safeCoins.push(this.add.image(safe.x + safe.w + 16 + (i % 3) * 14, safe.y + 30 + Math.floor(i / 3) * 16, 'coin').setDepth(safe.y + 60))
    }

    for (let i = 0; i < 6; i++) {
      this.crowd.push(this.add.image(668 + (i % 3) * 44, 370 + Math.floor(i / 3) * 44, workerKey('idle', false)).setScale(1.1))
    }

    // Nhân vật và va chạm: biên phòng chính + các vật cản.
    const main = ROOMS[0]
    this.physics.world.setBounds(main.x + WALL, main.y + WALL, main.w - WALL * 2, main.h - WALL * 2)
    this.player = this.physics.add.sprite(PLAYER_START.x, PLAYER_START.y, 'capitalist-0')
    this.player.setOrigin(0.5, 1).setCollideWorldBounds(true)
    this.player.body.setSize(24, 14).setOffset(6, 36)
    this.moveTarget = this.add.image(0, 0, 'move-target').setVisible(false).setDepth(1400).setScale(0.7)
    const solids = this.physics.add.staticGroup()
    for (const rect of Object.values(OBSTACLES)) {
      const zone = this.add.zone(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w, rect.h)
      solids.add(zone)
    }
    this.physics.add.collider(this.player, solids)

    // Không chặn phím của trình duyệt để các menu HTML vẫn nhận được phím mũi tên và Enter.
    const keyboard = this.input.keyboard!
    const key = (code: number) => keyboard.addKey(code, false)
    const K = Phaser.Input.Keyboard.KeyCodes
    this.keys = {
      up: key(K.UP),
      down: key(K.DOWN),
      left: key(K.LEFT),
      right: key(K.RIGHT),
      w: key(K.W),
      a: key(K.A),
      s: key(K.S),
      d: key(K.D),
    }
    // Bắt sự kiện nhấn E trực tiếp để không sót cú nhấn nhanh.
    keyboard.on('keydown-E', (event: KeyboardEvent) => {
      if (!event.repeat && this.near && !this.view.locked) this.callbacks.onInteract(this.near)
    })
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.view.locked || pointer.rightButtonDown() || pointer.middleButtonDown()) return
      const point = this.cameras.main.getWorldPoint(pointer.x, pointer.y)
      const toolBounds: { id: ZoneId; bounds: Rect }[] = [
        { id: 'machine', bounds: OBSTACLES.machine },
        { id: 'hr', bounds: OBSTACLES.hrDesk },
        { id: 'lever', bounds: OBSTACLES.lever },
        { id: 'safe', bounds: OBSTACLES.safe },
        { id: 'gate', bounds: GATE },
      ]
      const clickedTool = toolBounds.find(({ bounds }) =>
        point.x >= bounds.x && point.x <= bounds.x + bounds.w && point.y >= bounds.y && point.y <= bounds.y + bounds.h,
      )?.id
      const clickedZone = clickedTool
        ? ZONES.find((zone) => zone.id === clickedTool)
        : ZONES.find((zone) => Math.hypot(zone.x - point.x, zone.y - point.y) <= 64)
      if (!clickedZone && (point.x < 32 || point.x > 620 || point.y < 96 || point.y > 688)) return

      const start = { x: this.player.x, y: this.player.y - 14 }
      const goal = clickedZone ? this.getZoneApproachPoint(clickedZone, start) : point
      if (clickedZone && goal && Math.hypot(goal.x - start.x, goal.y - start.y) <= ZONE_RADIUS) {
        this.movementPath = []
        this.clearClickRoute()
        this.callbacks.onInteract(clickedZone.id)
        return
      }

      const route = findRoute(start, goal ?? point)
      if (route.length < 2) return
      this.movementPath = route.slice(1)
      this.interactionTarget = clickedZone?.id ?? null
      this.moveTarget.setPosition(route[route.length - 1].x, route[route.length - 1].y).setVisible(true)
    })

    this.refresh()
  }

  update(time: number, delta: number) {
    const { view, keys } = this
    const camera = this.cameras.main
    const transform = {
      x: camera.x - camera.worldView.x * camera.zoom,
      y: camera.y - camera.worldView.y * camera.zoom,
      scale: camera.zoom,
    }
    if (
      time - this.lastCameraEmit >= 32 &&
      (!Number.isFinite(this.lastCameraTransform.scale) ||
        Math.abs(transform.x - this.lastCameraTransform.x) > 0.1 ||
        Math.abs(transform.y - this.lastCameraTransform.y) > 0.1 ||
        Math.abs(transform.scale - this.lastCameraTransform.scale) > 0.001)
    ) {
      this.lastCameraEmit = time
      this.lastCameraTransform = transform
      this.callbacks.onCameraTransform(transform)
    }
    let dx = 0
    let dy = 0
    if (!view.locked) {
      dx = Number(keys.right.isDown || keys.d.isDown) - Number(keys.left.isDown || keys.a.isDown)
      dy = Number(keys.down.isDown || keys.s.isDown) - Number(keys.up.isDown || keys.w.isDown)
    }
    if (dx !== 0 || dy !== 0) {
      this.movementPath = []
      this.clearClickRoute()
    } else if (!view.locked && this.movementPath.length > 0) {
      const waypoint = this.movementPath[0]
      const playerPoint = { x: this.player.x, y: this.player.y - 14 }
      const distance = Math.hypot(waypoint.x - playerPoint.x, waypoint.y - playerPoint.y)
      if (distance <= 10) {
        this.movementPath.shift()
        if (this.movementPath.length === 0) {
          this.clearClickRoute()
          this.moveTarget.setVisible(false)
        }
      } else {
        dx = waypoint.x - playerPoint.x
        dy = waypoint.y - playerPoint.y
      }
    }
    const length = Math.hypot(dx, dy) || 1
    this.player.setVelocity((dx / length) * PLAYER_SPEED, (dy / length) * PLAYER_SPEED)
    this.player.setDepth(this.player.y)
    if (dx !== 0) this.player.setFlipX(dx < 0)
    if (!this.view.locked && this.interactionTarget && this.near === this.interactionTarget) {
      const target = this.interactionTarget
      this.interactionTarget = null
      this.movementPath = []
      this.clearClickRoute()
      this.moveTarget.setVisible(false)
      this.callbacks.onInteract(target)
    }
    if (dx !== 0 || dy !== 0) {
      this.stepClock += delta
      this.player.setTexture(Math.floor(this.stepClock / 130) % 2 === 0 ? 'capitalist-0' : 'capitalist-1')
    }



    // Khu vực tương tác gần nhất trong tầm.
    let nearest: ZoneId | null = null
    let best = ZONE_RADIUS
    for (const zone of ZONES) {
      const distance = Math.hypot(zone.x - this.player.x, zone.y - (this.player.y - 14))
      if (distance < best) {
        best = distance
        nearest = zone.id
      }
    }
    if (nearest !== this.near) {
      this.near = nearest
      this.callbacks.onNear(nearest)
    }
    const routeKey = `${view.tutorialTarget ?? ''}:${routeIndex(this.player.x, this.player.y - 14)}`
    if (routeKey !== this.lastTutorialRouteKey) {
      this.lastTutorialRouteKey = routeKey
      this.drawTutorialRoute()
    }

    // Công nhân làm việc: nhún đều, nhanh hơn khi sản xuất hoặc tăng ca, đứng im khi đình công.
    const producing = view.mode === 'producing'
    const speed = view.mode === 'strike' ? 0 : (producing ? 0.016 : 0.006) * (view.overtime ? 1.5 : 1)
    for (const worker of this.workers) {
      const wave = Math.sin(time * speed + worker.phase)
      worker.body.y = worker.baseY + wave * (producing ? 3 : 1.5)
      worker.body.angle = wave * (producing ? 7 : 3)
    }
    if (producing) for (const belt of this.belts) belt.tilePositionX -= delta * 0.12
  }

  private clearClickRoute() {
    this.moveTarget.setVisible(false)
  }

  private drawTutorialRoute() {
    const targetId = this.view.tutorialTarget
    this.tutorialRoute.clear()
    this.tutorialMarker.setVisible(false)
    this.tutorialArrow.setVisible(false)
    if (!targetId) return

    const target = ZONES.find((zone) => zone.id === targetId)
    if (!target) return
    const route = findRoute(
      { x: this.player.x, y: this.player.y - 14 },
      { x: target.x, y: target.y },
    )
    if (route.length < 2) return

    this.tutorialRoute.lineStyle(7, COLOR.ink, 0.72)
    this.drawDashedRoute(route, 18, 12)
    this.tutorialRoute.lineStyle(4, COLOR.amber, 1)
    this.drawDashedRoute(route, 18, 12)

    const endpoint = route[route.length - 1]
    this.tutorialMarker.setPosition(endpoint.x, endpoint.y).setVisible(true)
    this.tutorialArrow.setPosition(endpoint.x, endpoint.y - 43).setVisible(true)
  }

  private drawDashedRoute(route: RoutePoint[], dashLength: number, gapLength: number) {
    let draw = true
    let remaining = dashLength
    for (let index = 1; index < route.length; index++) {
      const from = route[index - 1]
      const to = route[index]
      const length = Math.hypot(to.x - from.x, to.y - from.y)
      if (length === 0) continue
      let offset = 0
      while (offset < length) {
        const segment = Math.min(remaining, length - offset)
        if (draw) {
          const startRatio = offset / length
          const endRatio = (offset + segment) / length
          this.tutorialRoute.lineBetween(
            from.x + (to.x - from.x) * startRatio,
            from.y + (to.y - from.y) * startRatio,
            from.x + (to.x - from.x) * endRatio,
            from.y + (to.y - from.y) * endRatio,
          )
        }
        offset += segment
        remaining -= segment
        if (remaining <= 0.001) {
          draw = !draw
          remaining = draw ? dashLength : gapLength
        }
      }
    }
  }

  private getZoneApproachPoint(zone: (typeof ZONES)[number], start: RoutePoint): RoutePoint | null {
    let point: RoutePoint | null = null
    let distance = Infinity
    for (let index = 0; index < ROUTE_COLUMNS * ROUTE_ROWS; index++) {
      const candidate = routePoint(index)
      const zoneDistance = Math.hypot(candidate.x - zone.x, candidate.y - zone.y)
      if (zoneDistance > ZONE_RADIUS - 8 || !Number.isFinite(zoneDistance)) continue
      const route = findRoute(start, candidate)
      if (route.length < 2) continue
      const routeLength = route.slice(1).reduce((total, waypoint, waypointIndex) => {
        const previous = route[waypointIndex]
        return total + Math.hypot(waypoint.x - previous.x, waypoint.y - previous.y)
      }, 0)
      if (routeLength < distance) {
        point = candidate
        distance = routeLength
      }
    }
    return point
  }

  // ---------- Vẽ lại theo state ----------

  private refresh() {
    const view = this.view
    const prev = this.drawn

    if (!prev || prev.factories !== view.factories) this.drawLots()
    if (!prev || prev.machineLevel !== view.machineLevel || prev.newGenMachines !== view.newGenMachines) {
      this.drawMachine()
      if (prev) {
        this.tweens.killTweensOf(this.machine)
        this.machine.setAlpha(1)
        this.tweens.add({ targets: this.machine, alpha: 0.3, duration: 90, yoyo: true, repeat: 2 })
      }
    }
    if (!prev || prev.overtime !== view.overtime || prev.factories !== view.factories) {
      this.overtimeTint.clear()
      if (view.overtime) {
        this.overtimeTint.fillStyle(COLOR.red, 0.13)
        for (const room of ROOMS.slice(0, view.factories)) this.overtimeTint.fillRect(room.x, room.y, room.w, room.h)
      }
    }
    this.belts.forEach((belt, room) => belt.setVisible(room < view.factories))
    this.syncWorkers()
    this.crowd.forEach((person) => person.setVisible(view.crowd))
    this.safeGlow.setVisible(view.surplusWaiting)
    this.safeCoins.forEach((coin) => coin.setVisible(view.surplusWaiting))

    if (prev?.mode !== view.mode) this.changeMode()
    if (prev && prev.visualEffect?.id !== view.visualEffect?.id && view.visualEffect) this.showUpgradeEffect(view.visualEffect.kind)
    if (prev && prev.productionEffect?.id !== view.productionEffect?.id && view.productionEffect) {
      this.showWorkerFigures(view.productionEffect)
    }
    this.drawn = view
  }

  private showWorkerFigures(effect: { wages: number[]; surplus: number }) {
    this.workerFigures.forEach((figure) => figure.destroy())
    this.workerFigures = []
    effect.wages.forEach((wage, index) => {
      const worker = this.workers[index]
      if (!worker) return
      const surplus = effect.surplus > 0
        ? Math.floor(effect.surplus / effect.wages.length) + Number(index < effect.surplus % effect.wages.length)
        : 0
      const entries = [
        { text: `−$${wage.toLocaleString('en-US')}`, color: '#d62828', offset: -48 },
        ...(surplus > 0 ? [{ text: `+$${surplus.toLocaleString('en-US')}`, color: '#0b7a75', offset: -69 }] : []),
      ]
      entries.forEach((entry, entryIndex) => {
        const figure = this.add
          .text(worker.body.x, worker.body.y + entry.offset, entry.text, {
            fontFamily: 'Be Vietnam Pro, Segoe UI, sans-serif',
            fontSize: '15px',
            fontStyle: 'bold',
            color: entry.color,
            stroke: '#fffdf8',
            strokeThickness: 4,
            align: 'center',
          })
          .setOrigin(0.5)
          .setDepth(2500)
          .setAlpha(0)
        this.workerFigures.push(figure)
        this.tweens.add({
          targets: figure,
          y: figure.y - 24,
          alpha: 1,
          duration: 240,
          delay: index * 55 + entryIndex * 70,
          ease: 'Back.Out',
          hold: 800,
          yoyo: true,
          onComplete: () => figure.destroy(),
        })
      })
    })
  }

  private showUpgradeEffect(kind: 'machine' | 'factory') {
    const room = kind === 'machine' ? null : ROOMS[Math.min(this.view.factories - 1, ROOMS.length - 1)]
    const focus = kind === 'machine' ? { x: 156, y: 142 } : { x: room!.x + room!.w / 2, y: room!.y + room!.h / 2 }
    const camera = this.cameras.main
    this.effectResetTimer?.remove()
    this.tweens.killTweensOf(camera)
    camera.flash(260, 255, 230, 150, true)
    camera.shake(320, 0.006, true)
    camera.pan(focus.x, focus.y, 380, 'Sine.easeInOut', true)
    camera.zoomTo(1.45, 380, 'Sine.easeOut', true)

    const pulse = this.add.circle(focus.x, focus.y, kind === 'machine' ? 68 : 112, COLOR.amber, 0.55).setDepth(3000)
    pulse.setStrokeStyle(8, COLOR.card)
    this.tweens.add({
      targets: pulse,
      scale: { from: 0.55, to: 1.7 },
      alpha: { from: 0.8, to: 0 },
      duration: 950,
      ease: 'Cubic.Out',
      onComplete: () => pulse.destroy(),
    })
    this.time.delayedCall(720, () => this.showUpgradeSparkles(focus))

    this.effectResetTimer = this.time.delayedCall(1100, () => {
      camera.pan(640, 360, 420, 'Sine.easeInOut', true)
      camera.zoomTo(1, 420, 'Sine.easeInOut', true)
    })
  }

  private showUpgradeSparkles(focus: RoutePoint) {
    const count = 12
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const distance = 44 + (i % 3) * 15
      const startX = focus.x + Math.cos(angle) * distance
      const startY = focus.y + Math.sin(angle) * distance
      const sparkle = this.add.image(startX, startY, 'upgrade-sparkle').setDepth(3100).setAlpha(0).setScale(0.1)
      this.tweens.add({
        targets: sparkle,
        alpha: { from: 0, to: 1 },
        scale: { from: 0.1, to: 0.65 + (i % 3) * 0.12 },
        x: startX + Math.cos(angle) * 20,
        y: startY + Math.sin(angle) * 20,
        angle: 360,
        duration: 400,
        delay: i * 35,
        hold: 100,
        yoyo: true,
        onComplete: () => sparkle.destroy(),
      })
    }
  }

  private syncWorkers() {
    const { workers, cheapWorkers, mood, mode } = this.view
    while (this.workers.length > workers) {
      const gone = this.workers.pop()!
      gone.body.destroy()
      gone.banner.destroy()
    }
    while (this.workers.length < workers) {
      const spot = workerSpot(this.workers.length)
      const body = this.add.image(spot.x, spot.y, workerKey(mood, false)).setDepth(spot.y)
      const banner = this.add.image(spot.x, spot.y - 30, 'banner').setDepth(spot.y + 1).setVisible(false)
      if (this.drawn) this.tweens.add({ targets: body, scale: { from: 0, to: 1 }, duration: 260, ease: 'Back.Out' })
      this.workers.push({ body, banner, baseY: spot.y, phase: this.workers.length * 1.7 })
    }
    this.workers.forEach((worker, index) => {
      worker.body.setTexture(workerKey(mood, index >= workers - cheapWorkers))
      worker.banner.setVisible(mode === 'strike')
    })
  }

  private changeMode() {
    const { mode } = this.view
    this.boxTimer?.remove()
    this.boxTimer = null
    if (mode === 'producing') {
      this.tweens.add({ targets: this.leverHandle, angle: 35, duration: 220, ease: 'Back.Out' })
      this.boxTimer = this.time.addEvent({ delay: PRODUCE_BOX_INTERVAL, loop: true, callback: this.spawnBoxes, callbackScope: this })
      this.spawnBoxes()
    } else {
      this.tweens.add({ targets: this.leverHandle, angle: -35, duration: 220 })
      if (mode === 'strike') this.cameras.main.shake(280, 0.004)
    }
  }

  // Hàng chạy trên băng chuyền, tới cuối thì hóa thành đồng tiền bay về ô Tiền mặt.
  private spawnBoxes() {
    for (let room = 0; room < this.view.factories; room++) {
      if (this.view.workers <= room * 10) continue
      const c = roomConveyor(room)
      const box = this.add.image(c.x + 12, c.y + c.h / 2, 'box').setDepth(c.y + 1)
      this.tweens.add({
        targets: box,
        x: c.x + c.w - 12,
        duration: 1300,
        onComplete: () => {
          const coin = this.add.image(box.x, box.y, 'coin').setDepth(2000)
          box.destroy()
          this.tweens.add({
            targets: coin,
            x: CASH_HUD.x,
            y: CASH_HUD.y,
            alpha: { from: 1, to: 0.2 },
            duration: 620,
            ease: 'Cubic.In',
            onComplete: () => coin.destroy(),
          })
        },
      })
    }
  }

  private drawStaticWorld() {
    const g = this.add.graphics()
    const main = ROOMS[0]
    this.drawRoom(g, main)

    // Cổng bên hông
    g.fillStyle(COLOR.paper).fillRect(GATE.x, GATE.y, GATE.w, GATE.h)
    g.fillStyle(COLOR.amber)
    for (let i = 0; i < 4; i++) g.fillRect(GATE.x + 4, GATE.y + 6 + i * 20, GATE.w - 8, 8)
    g.lineStyle(3, COLOR.ink).strokeRect(GATE.x, GATE.y, GATE.w, GATE.h)

    // Bàn nhân sự
    const desk = OBSTACLES.hrDesk
    g.fillStyle(COLOR.teal).fillRect(desk.x, desk.y, desk.w, desk.h)
    g.lineStyle(3, COLOR.ink).strokeRect(desk.x, desk.y, desk.w, desk.h)
    g.fillStyle(COLOR.card)
    for (let i = 0; i < 3; i++) g.fillRect(desk.x + 14 + i * 48, desk.y + 12, 34, 26)
    g.fillStyle(COLOR.ink)
    for (let i = 0; i < 3; i++) g.fillRect(desk.x + 20 + i * 48, desk.y + 20, 22, 3).fillRect(desk.x + 20 + i * 48, desk.y + 27, 14, 3)

    // Bệ cần gạt
    const lever = OBSTACLES.lever
    g.fillStyle(COLOR.ink).fillRoundedRect(lever.x, lever.y, lever.w, lever.h, 6)
    g.fillStyle(COLOR.amber).fillCircle(lever.x + lever.w / 2, lever.y + lever.h / 2, 7)

    // Két sắt
    const safe = OBSTACLES.safe
    g.fillStyle(COLOR.ink).fillRoundedRect(safe.x, safe.y, safe.w, safe.h, 6)
    g.lineStyle(3, COLOR.amber).strokeRoundedRect(safe.x + 8, safe.y + 8, safe.w - 16, safe.h - 16, 4)
    g.fillStyle(COLOR.amber).fillCircle(safe.x + safe.w / 2, safe.y + safe.h / 2, 13)
    g.fillStyle(COLOR.ink).fillCircle(safe.x + safe.w / 2, safe.y + safe.h / 2, 5)
  }

  private drawRoom(g: Phaser.GameObjects.Graphics, room: Rect) {
    g.fillStyle(COLOR.ink).fillRect(room.x, room.y, room.w, room.h)
    g.fillStyle(COLOR.card).fillRect(room.x + WALL, room.y + WALL, room.w - WALL * 2, room.h - WALL * 2)
    g.lineStyle(2, COLOR.ink, 0.07)
    for (let x = room.x + WALL + 48; x < room.x + room.w - WALL; x += 48) g.lineBetween(x, room.y + WALL, x, room.y + room.h - WALL)
    for (let y = room.y + WALL + 48; y < room.y + room.h - WALL; y += 48) g.lineBetween(room.x + WALL, y, room.x + room.w - WALL, y)
  }

  // Phòng liền kề: đất trống viền đứt cho tới khi mở xưởng.
  private drawLots() {
    const g = this.lots.clear()
    ROOMS.slice(1).forEach((room, index) => {
      if (index + 1 < this.view.factories) {
        this.drawRoom(g, room)
        return
      }
      g.lineStyle(3, COLOR.ink, 0.35)
      const dash = 16
      for (let x = room.x; x < room.x + room.w; x += dash * 2) {
        g.lineBetween(x, room.y, Math.min(x + dash, room.x + room.w), room.y)
        g.lineBetween(x, room.y + room.h, Math.min(x + dash, room.x + room.w), room.y + room.h)
      }
      for (let y = room.y; y < room.y + room.h; y += dash * 2) {
        g.lineBetween(room.x, y, room.x, Math.min(y + dash, room.y + room.h))
        g.lineBetween(room.x + room.w, y, room.x + room.w, Math.min(y + dash, room.y + room.h))
      }
    })
  }

  // Máy đổi hình theo cấp: thân dài ra, thêm bánh răng và ống khói. Máy thế hệ mới thêm khối xanh.
  private drawMachine() {
    const g = this.machine.clear()
    const area = OBSTACLES.machine
    const level = this.view.machineLevel
    g.fillStyle(COLOR.ink, 0.12).fillRect(area.x, area.y, area.w, area.h)

    if (level === 0) {
      // Cấp 0: chỉ là bàn làm thủ công.
      g.fillStyle(COLOR.card).fillRect(area.x + 10, area.y + 26, 76, 40)
      g.lineStyle(3, COLOR.ink).strokeRect(area.x + 10, area.y + 26, 76, 40)
      g.lineBetween(area.x + 28, area.y + 38, area.x + 62, area.y + 54)
      g.fillStyle(COLOR.ink).fillRect(area.x + 56, area.y + 46, 14, 12)
    } else {
      const width = 56 + level * 23
      const x = area.x + 8
      const y = area.y + 22
      for (let i = 0; i < Math.ceil(level / 2); i++) g.fillStyle(COLOR.ink).fillRect(x + 12 + i * 44, area.y + 4, 12, 20)
      g.fillStyle(COLOR.ink).fillRoundedRect(x, y, width, 50, 5)
      for (let i = 0; i < level; i++) {
        g.fillStyle(COLOR.amber).fillCircle(x + 20 + i * 23, y + 20, 9)
        g.fillStyle(COLOR.ink).fillCircle(x + 20 + i * 23, y + 20, 3.5)
      }
      for (let i = 0; i < 5; i++) g.fillStyle(i < level ? COLOR.amber : COLOR.gray).fillRect(x + 10 + i * 12, y + 37, 8, 6)
    }

    if (this.view.newGenMachines > 0) {
      const x = area.x + area.w - 36
      g.fillStyle(COLOR.teal).fillRoundedRect(x, area.y + 8, 30, 64, 5)
      g.lineStyle(3, COLOR.ink).strokeRoundedRect(x, area.y + 8, 30, 64, 5)
      g.fillStyle(COLOR.amber).fillTriangle(x + 18, area.y + 16, x + 8, area.y + 42, x + 16, area.y + 42)
      g.fillTriangle(x + 14, area.y + 38, x + 22, area.y + 38, x + 12, area.y + 64)
    }
  }
}
