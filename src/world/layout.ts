// Bố cục thế giới 2D trên khung 1280x720. HUD chiếm dải trên (64px) và cột phải (280px).
// File này không import Phaser để lớp HTML (nhãn, gợi ý "Nhấn E") dùng chung tọa độ.

export type ZoneId = 'machine' | 'hr' | 'lever' | 'safe' | 'gate'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export const VIEW = { width: 1280, height: 720 }
export const HUD_TOP = 64
export const HUD_RIGHT = 280
export const WALL = 12

// Phòng chính (đi lại được) và hai phòng liền kề hiện ra khi mở thêm xưởng.
export const ROOMS: Rect[] = [
  { x: 20, y: 84, w: 600, h: 616 },
  { x: 644, y: 84, w: 340, h: 236 },
  { x: 644, y: 464, w: 340, h: 236 },
]

// Vật cản trong phòng chính (nhân vật không đi xuyên qua được).
export const OBSTACLES: Record<'machine' | 'hrDesk' | 'conveyor' | 'lever' | 'safe', Rect> = {
  machine: { x: 48, y: 102, w: 216, h: 78 },
  hrDesk: { x: 440, y: 628, w: 164, h: 54 },
  conveyor: { x: 264, y: 142, w: 334, h: 36 },
  lever: { x: 302, y: 398, w: 36, h: 36 },
  safe: { x: 40, y: 606, w: 110, h: 76 },
}

export const GATE: Rect = { x: 608, y: 352, w: 24, h: 80 }

export interface Zone {
  id: ZoneId
  key: string // phím số mở nhanh
  x: number // điểm đứng để tương tác
  y: number
  labelX: number // tâm nhãn tên khu vực
  labelY: number
}

export const ZONE_RADIUS = 38

export const ZONES: Zone[] = [
  // Nhãn đặt trên tường hoặc ngoài lối đi để không che nhân vật.
  { id: 'machine', key: '1', x: 156, y: 214, labelX: 150, labelY: 90 },
  { id: 'hr', key: '2', x: 522, y: 596, labelX: 500, labelY: 694 },
  { id: 'lever', key: '3', x: 320, y: 436, labelX: 320, labelY: 372 },
  { id: 'safe', key: '4', x: 104, y: 574, labelX: 110, labelY: 694 },
  { id: 'gate', key: '5', x: 574, y: 392, labelX: 716, labelY: 340 },
]

export const PLAYER_START = { x: 320, y: 520 }
export const PLAYER_SPEED = 290

// Vị trí đứng của công nhân: 5 người mỗi bên băng chuyền.
// Dây chuyền phòng chính nằm sát tường trên, nối từ máy sang phải, để phần sàn còn lại thông thoáng.
export function workerSpot(index: number): { x: number; y: number } {
  const room = Math.floor(index / 10)
  const slot = index % 10
  const column = slot % 5
  const top = slot < 5
  if (room === 0) return { x: 300 + column * 66, y: top ? 118 : 206 }
  const r = ROOMS[room]
  return { x: r.x + 62 + column * 54, y: r.y + r.h / 2 + (top ? -40 : 44) }
}

export function roomConveyor(room: number): Rect {
  if (room === 0) return OBSTACLES.conveyor
  const r = ROOMS[room]
  return { x: r.x + 36, y: r.y + r.h / 2 - 12, w: r.w - 72, h: 28 }
}
