import Phaser from 'phaser'

// Bảng màu dùng chung với lớp HTML (xem src/index.css).
export const COLOR = {
  ink: 0x17171c,
  paper: 0xf3eee3,
  card: 0xfffdf8,
  red: 0xd62828,
  amber: 0xf5b301,
  teal: 0x0b7a75,
  gray: 0x8d8b8f,
}

export type Mood = 'happy' | 'neutral' | 'angry' | 'idle'
const MOOD_COLOR: Record<Mood, number> = {
  happy: COLOR.teal,
  neutral: COLOR.amber,
  angry: COLOR.red,
  idle: COLOR.gray,
}

export const workerKey = (mood: Mood, cheap: boolean) => `worker-${mood}-${cheap ? 'cheap' : 'normal'}`

// Công nhân: đầu tròn có biểu cảm, thân đổi màu theo Mức hài lòng. Nhóm lương thấp có thân rỗng.
function drawWorker(g: Phaser.GameObjects.Graphics, mood: Mood, cheap: boolean) {
  const color = MOOD_COLOR[mood]
  g.fillStyle(cheap ? COLOR.card : color).fillRoundedRect(3, 17, 22, 14, 5)
  g.lineStyle(3, cheap ? color : COLOR.ink).strokeRoundedRect(3, 17, 22, 14, 5)
  g.fillStyle(COLOR.card).fillCircle(14, 11, 9)
  g.lineStyle(2.5, COLOR.ink).strokeCircle(14, 11, 9)
  g.fillStyle(COLOR.ink).fillRect(5, 1, 18, 5) // mũ lưỡi trai
  g.fillCircle(11, 10, 1.6).fillCircle(17, 10, 1.6)
  g.lineStyle(2, COLOR.ink).beginPath()
  if (mood === 'happy') g.arc(14, 12, 4, 0.2, Math.PI - 0.2)
  else if (mood === 'angry') g.arc(14, 18, 4, Math.PI + 0.35, -0.35)
  else g.moveTo(11, 15).lineTo(17, 15)
  g.strokePath()
}

// Nhà tư bản: mũ cao, vest đen, cà vạt đỏ. Hai khung hình chân để tạo dáng đi.
function drawCapitalist(g: Phaser.GameObjects.Graphics, frame: number) {
  g.fillStyle(COLOR.ink)
  g.fillRect(frame === 0 ? 9 : 11, 44, 7, 6).fillRect(frame === 0 ? 21 : 19, 44, 7, 6)
  g.fillRoundedRect(6, 28, 24, 18, 5) // vest
  g.fillStyle(COLOR.card).fillTriangle(13, 28, 23, 28, 18, 38)
  g.fillStyle(COLOR.red).fillTriangle(16, 29, 20, 29, 18, 40)
  g.fillStyle(COLOR.card).fillCircle(18, 21, 9)
  g.lineStyle(2.5, COLOR.ink).strokeCircle(18, 21, 9)
  g.fillStyle(COLOR.ink).fillCircle(15, 21, 1.6).fillCircle(21, 21, 1.6)
  g.fillRect(14, 25, 8, 2) // ria mép
  g.fillRect(9, 0, 18, 13).fillRect(4, 12, 28, 4) // mũ cao
  g.fillStyle(COLOR.red).fillRect(9, 8, 18, 4)
}

export function createTextures(scene: Phaser.Scene) {
  const make = (key: string, width: number, height: number, draw: (g: Phaser.GameObjects.Graphics) => void) => {
    if (scene.textures.exists(key)) return
    const g = scene.make.graphics({ x: 0, y: 0 }, false)
    draw(g)
    g.generateTexture(key, width, height)
    g.destroy()
  }

  for (const mood of ['happy', 'neutral', 'angry', 'idle'] as Mood[]) {
    for (const cheap of [false, true]) make(workerKey(mood, cheap), 28, 33, (g) => drawWorker(g, mood, cheap))
  }
  make('capitalist-0', 36, 50, (g) => drawCapitalist(g, 0))
  make('capitalist-1', 36, 50, (g) => drawCapitalist(g, 1))

  make('move-target', 44, 44, (g) => {
    g.fillStyle(COLOR.ink).fillPoints([
      { x: 8, y: 2 }, { x: 22, y: 15 }, { x: 36, y: 2 }, { x: 42, y: 8 },
      { x: 29, y: 22 }, { x: 42, y: 36 }, { x: 36, y: 42 }, { x: 22, y: 29 },
      { x: 8, y: 42 }, { x: 2, y: 36 }, { x: 15, y: 22 }, { x: 2, y: 8 },
    ], true)
    g.fillStyle(COLOR.red).fillPoints([
      { x: 9, y: 7 }, { x: 22, y: 19 }, { x: 35, y: 7 }, { x: 38, y: 10 },
      { x: 26, y: 22 }, { x: 38, y: 35 }, { x: 35, y: 38 }, { x: 22, y: 26 },
      { x: 9, y: 38 }, { x: 6, y: 35 }, { x: 18, y: 22 }, { x: 6, y: 10 },
    ], true)
  })
  make('tutorial-arrow', 36, 52, (g) => {
    g.fillStyle(COLOR.ink).fillPoints([
      { x: 12, y: 2 }, { x: 24, y: 2 }, { x: 24, y: 25 }, { x: 34, y: 25 },
      { x: 18, y: 48 }, { x: 2, y: 25 }, { x: 12, y: 25 },
    ], true)
    g.fillStyle(COLOR.amber).fillPoints([
      { x: 15, y: 5 }, { x: 21, y: 5 }, { x: 21, y: 33 }, { x: 28, y: 28 },
      { x: 18, y: 43 }, { x: 8, y: 28 }, { x: 15, y: 33 },
    ], true)
  })
  make('upgrade-sparkle', 40, 40, (g) => {
    g.fillStyle(COLOR.ink).fillPoints([
      { x: 20, y: 0 }, { x: 25, y: 15 }, { x: 40, y: 20 }, { x: 25, y: 25 },
      { x: 20, y: 40 }, { x: 15, y: 25 }, { x: 0, y: 20 }, { x: 15, y: 15 },
    ], true)
    g.fillStyle(COLOR.card).fillPoints([
      { x: 20, y: 5 }, { x: 24, y: 16 }, { x: 35, y: 20 }, { x: 24, y: 24 },
      { x: 20, y: 35 }, { x: 16, y: 24 }, { x: 5, y: 20 }, { x: 16, y: 16 },
    ], true)
    g.fillStyle(COLOR.amber).fillCircle(20, 20, 4)
  })

  make('banner', 34, 30, (g) => {
    g.fillStyle(COLOR.ink).fillRect(15, 14, 4, 16)
    g.fillStyle(COLOR.red).fillRect(1, 1, 32, 16)
    g.lineStyle(2, COLOR.ink).strokeRect(1, 1, 32, 16)
    g.fillStyle(COLOR.card).fillRect(6, 6, 22, 2).fillRect(6, 10, 14, 2)
  })
  make('box', 20, 18, (g) => {
    g.fillStyle(COLOR.amber).fillRect(1, 1, 18, 16)
    g.lineStyle(2.5, COLOR.ink).strokeRect(1, 1, 18, 16)
    g.lineBetween(1, 7, 19, 7)
  })
  make('coin', 18, 18, (g) => {
    g.fillStyle(COLOR.amber).fillCircle(9, 9, 8)
    g.lineStyle(2.5, COLOR.ink).strokeCircle(9, 9, 7.5)
    g.fillStyle(COLOR.ink).fillRect(8, 5, 2, 8)
  })
  make('belt', 32, 36, (g) => {
    g.fillStyle(COLOR.ink).fillRect(0, 0, 32, 36)
    g.lineStyle(3, COLOR.gray).lineBetween(8, 6, 20, 18).lineBetween(20, 18, 8, 30)
  })
}
