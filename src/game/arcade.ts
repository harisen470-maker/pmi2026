import { GameLoop } from './engine'
import { SkyBackdrop } from './sky'

export type ArcadeHud = {
  score: number
  hearts: number
  wave: number
  combo: number
  target: string
  message: string
  roomName: string
}

type Platform = { x: number; y: number; w: number; baseX: number; baseY: number; dx: number; dy: number; moveX: number; moveY: number; speed: number }
type Crystal = { x: number; y: number; label: string; correct: boolean; active: boolean; respawn: number }
type Enemy = { x: number; y: number; min: number; max: number; vx: number; alive: boolean }
type Particle = { active: boolean; x: number; y: number; vx: number; vy: number; life: number; color: string }
type Room = {
  name: string
  spawn: [number, number]
  platforms: [number, number, number, number?, number?, number?][]
  crystals: [number, number][]
  enemies: [number, number, number, number][]
}

type Callbacks = {
  onHud: (hud: ArcadeHud) => void
  onSound: (id: 'move' | 'explosion' | 'pickup' | 'hit' | 'win' | 'lose') => void
  onEnd: (result: 'win' | 'lose', score: number) => void
}

const WAVES = [
  { target: '1/2', options: [['2/4', true], ['1/3', false], ['2/3', false]] },
  { target: '1/2', options: [['3/4', false], ['3/6', true], ['1/4', false]] },
  { target: '1/3', options: [['2/3', false], ['3/4', false], ['2/6', true]] },
  { target: '3/4', options: [['6/8', true], ['2/3', false], ['4/5', false]] },
  { target: '2/3', options: [['3/4', false], ['4/6', true], ['2/5', false]] },
  { target: '1/4', options: [['1/2', false], ['3/4', false], ['2/8', true]] },
  { target: '3/5', options: [['6/10', true], ['3/4', false], ['5/6', false]] },
  { target: '5/6', options: [['4/5', false], ['6/5', false], ['10/12', true]] },
] as const

// Every room is a compact, solvable platforming puzzle. Platform tuples are
// x, y, width, optional horizontal travel, vertical travel, and movement speed.
const ROOMS: Room[] = [
  { name: 'Kaki Gunung', spawn: [35, 230], platforms: [], crystals: [[90, 220], [240, 220], [390, 220]], enemies: [] },
  { name: 'Tebing Salju', spawn: [240, 230], platforms: [[45, 200, 115], [185, 155, 110], [325, 200, 115]], crystals: [[100, 174], [240, 129], [385, 174]], enemies: [] },
  { name: 'Hutan Batu', spawn: [240, 230], platforms: [[25, 195, 120], [180, 200, 120], [335, 175, 120]], crystals: [[85, 169], [240, 174], [395, 149]], enemies: [[230, 248, 155, 320]] },
  { name: 'Tangga Angin', spawn: [55, 230], platforms: [[20, 205, 100], [150, 160, 100], [280, 115, 90], [390, 195, 75], [175, 220, 65, 45, 0, 1.5]], crystals: [[70, 179], [200, 134], [325, 89]], enemies: [[350, 248, 300, 450]] },
  { name: 'Lembah Slime', spawn: [240, 230], platforms: [[35, 190, 125], [185, 190, 110], [330, 190, 115]], crystals: [[100, 164], [240, 164], [390, 164]], enemies: [[130, 248, 40, 220], [350, 248, 285, 450], [235, 190, 195, 280]] },
  { name: 'Gua Berkabut', spawn: [50, 230], platforms: [[20, 205, 105], [150, 160, 85], [300, 205, 145], [185, 215, 70, 0, -50, 1.35]], crystals: [[75, 179], [195, 134], [375, 179]], enemies: [[190, 160, 160, 220], [370, 248, 300, 440]] },
  { name: 'Ranjau Es', spawn: [240, 230], platforms: [[20, 195, 105], [155, 150, 95], [285, 195, 80], [385, 145, 80], [205, 220, 70, 55, 0, 1.7]], crystals: [[75, 169], [205, 124], [425, 119]], enemies: [[190, 150, 165, 235], [325, 248, 260, 420]] },
  { name: 'Puncak Penjaga', spawn: [240, 230], platforms: [[15, 205, 95], [135, 160, 90], [255, 115, 90], [375, 175, 90], [195, 215, 65, 40, -25, 1.5]], crystals: [[65, 179], [180, 134], [300, 89]], enemies: [[170, 160, 145, 210], [415, 175, 385, 450], [250, 248, 180, 350]] },
]

const PALETTES = [
  ['#31566f', '#50b889', '#8ee6a3'], ['#3b4f78', '#70b7c9', '#b4edf0'],
  ['#31566f', '#3fa976', '#91dc91'], ['#4d4779', '#7cc6d9', '#c0eff0'],
  ['#31566f', '#58bd8c', '#a4e79f'], ['#455879', '#86b7c9', '#c9e6e8'],
  ['#31566f', '#68c6d5', '#b7f1eb'], ['#554579', '#d0b45d', '#ffe59a'],
]

declare global {
  interface Window { __arcadeProbe?: () => { x: number; y: number; wave: number; hearts: number; correctX: number; correctY: number; wrongX: number; wrongY: number; onGround: boolean; enemies: number; score: number } }
}

export class FractionArcade {
  private ctx: CanvasRenderingContext2D
  private loop: GameLoop
  private sky = new SkyBackdrop()
  private keys = { left: false, right: false }
  private player = { x: 240, y: 230, vx: 0, vy: 0, onGround: false, coyote: 0, jumpBuffer: 0, invuln: 0, facing: 1 }
  private ground: Platform | null = null
  private platforms: Platform[] = []
  private crystals: Crystal[] = []
  private enemies: Enemy[] = []
  private particles: Particle[] = Array.from({ length: 72 }, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, color: '#fff' }))
  private wave = 0
  private hearts = 3
  private score = 0
  private combo = 0
  private paused = false
  private ended = false
  private transition = 0
  private time = 0
  private shake = 0
  private roomHit = false
  private message = 'Bergerak dengan A/D, lompat dengan Spasi.'

  constructor(private canvas: HTMLCanvasElement, private callbacks: Callbacks) {
    canvas.width = 480
    canvas.height = 270
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D tidak tersedia')
    this.ctx = ctx
    this.ctx.imageSmoothingEnabled = false
    this.loadRoom()
    this.loop = new GameLoop({ update: dt => this.update(dt), render: () => this.render() })
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('blur', this.clearKeys)
    window.__arcadeProbe = () => {
      const correct = this.crystals.find(c => c.correct)
      const wrong = this.crystals.find(c => !c.correct)
      return { x: this.player.x, y: this.player.y, wave: this.wave, hearts: this.hearts, correctX: correct?.x ?? this.player.x, correctY: correct?.y ?? this.player.y, wrongX: wrong?.x ?? this.player.x, wrongY: wrong?.y ?? this.player.y, onGround: this.player.onGround, enemies: this.enemies.filter(e => e.alive).length, score: this.score }
    }
    this.loop.start()
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space', 'KeyA', 'KeyD', 'KeyW'].includes(e.code)) e.preventDefault()
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true
    if ((e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') && !e.repeat) this.jump()
  }
  private onKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') this.releaseJump()
  }
  private clearKeys = () => { this.keys.left = false; this.keys.right = false }

  setDirection(direction: -1 | 0 | 1) {
    this.keys.left = direction === -1
    this.keys.right = direction === 1
  }
  jump() { if (!this.paused && !this.ended) this.player.jumpBuffer = .13 }
  releaseJump() { if (this.player.vy < -120) this.player.vy = -120 }
  setPaused(value: boolean) { this.paused = value; this.player.jumpBuffer = 0; this.clearKeys() }

  private loadRoom() {
    const room = ROOMS[this.wave]
    this.platforms = [{ x: 0, y: 248, w: 480, baseX: 0, baseY: 248, dx: 0, dy: 0, moveX: 0, moveY: 0, speed: 0 }]
    for (const p of room.platforms) this.platforms.push({ x: p[0], y: p[1], w: p[2], baseX: p[0], baseY: p[1], dx: 0, dy: 0, moveX: p[3] || 0, moveY: p[4] || 0, speed: p[5] || 0 })
    const rotation = this.wave % 3
    this.crystals = WAVES[this.wave].options.map((option, i) => {
      const pos = room.crystals[(i + rotation) % 3]
      return { x: pos[0], y: pos[1], label: option[0], correct: option[1], active: true, respawn: 0 }
    })
    this.enemies = room.enemies.map((e, i) => ({ x: e[0], y: e[1], min: e[2], max: e[3], vx: i % 2 ? -34 : 34, alive: true }))
    this.player.x = room.spawn[0]; this.player.y = room.spawn[1]; this.player.vx = 0; this.player.vy = 0; this.player.onGround = false; this.player.invuln = 0; this.ground = null
    this.roomHit = false
    this.message = this.wave === 0 ? 'A/D bergerak • Spasi melompat • Pilih kristal senilai' : `${room.name}: temukan kristal yang tepat!`
    this.emitHud()
  }

  private emitHud() {
    this.callbacks.onHud({ score: this.score, hearts: this.hearts, wave: this.wave, combo: this.combo, target: WAVES[Math.min(this.wave, WAVES.length - 1)].target, message: this.message, roomName: ROOMS[Math.min(this.wave, ROOMS.length - 1)].name })
  }

  private burst(x: number, y: number, color: string, count = 12) {
    let spawned = 0
    for (let i = 0; i < this.particles.length && spawned < count; i++) {
      const p = this.particles[i]
      if (p.active) continue
      const angle = spawned / count * Math.PI * 2
      p.active = true; p.x = x; p.y = y; p.vx = Math.cos(angle) * (30 + spawned * 2); p.vy = Math.sin(angle) * 40 - 25; p.life = .65; p.color = color
      spawned++
    }
  }

  private damage(sourceX: number, reason: string) {
    if (this.player.invuln > 0 || this.ended || this.transition > 0) return
    this.hearts--
    this.combo = 0
    this.roomHit = true
    this.score = Math.max(0, this.score - 40)
    this.player.invuln = 1.45
    this.player.vx = this.player.x < sourceX ? -145 : 145
    this.player.vy = -190
    this.player.onGround = false
    this.ground = null
    this.shake = 1
    this.message = reason
    this.burst(this.player.x, this.player.y - 10, '#ff6b7d')
    this.callbacks.onSound('hit')
    if (this.hearts <= 0) {
      this.ended = true
      this.callbacks.onSound('lose')
      this.callbacks.onEnd('lose', this.score)
    }
    this.emitHud()
  }

  private collect(crystal: Crystal) {
    if (!crystal.active || this.transition > 0 || this.ended) return
    if (!crystal.correct) {
      crystal.active = false
      crystal.respawn = 1.4
      this.damage(crystal.x, `${crystal.label} tidak senilai dengan ${WAVES[this.wave].target}. Coba lagi!`)
      return
    }
    crystal.active = false
    this.combo++
    this.score += 150 + (this.combo - 1) * 25 + (this.roomHit ? 0 : 75)
    this.burst(crystal.x, crystal.y, '#62f5c8', 20)
    this.callbacks.onSound('pickup')
    this.wave++
    let healed = false
    if (this.wave % 2 === 0 && this.hearts < 3) { this.hearts++; healed = true }
    this.message = this.combo > 2 ? `Combo ×${this.combo}! ${healed ? '+1 hati • ' : ''}Terus mendaki!` : `Tepat! ${healed ? '+1 hati • ' : ''}Area berikutnya terbuka.`
    if (this.wave >= ROOMS.length) {
      this.ended = true
      this.callbacks.onSound('win')
      this.callbacks.onEnd('win', this.score)
    } else this.transition = .85
    this.emitHud()
  }

  private updatePlatforms() {
    for (const p of this.platforms) {
      const oldX = p.x, oldY = p.y
      if (p.speed) {
        const wave = Math.sin(this.time * p.speed)
        p.x = p.baseX + wave * p.moveX
        p.y = p.baseY + wave * p.moveY
      }
      p.dx = p.x - oldX; p.dy = p.y - oldY
    }
  }

  private update(dt: number) {
    if (this.paused || this.ended) return
    this.time += dt
    this.shake = Math.max(0, this.shake - dt * 4)
    for (const p of this.particles) {
      if (!p.active) continue
      p.life -= dt
      if (p.life <= 0) { p.active = false; continue }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 100 * dt
    }
    for (const c of this.crystals) {
      if (!c.active && c.respawn > 0) { c.respawn -= dt; if (c.respawn <= 0) c.active = true }
    }
    this.updatePlatforms()
    if (this.transition > 0) {
      this.transition -= dt
      if (this.transition <= 0) this.loadRoom()
      return
    }

    const pl = this.player
    pl.invuln = Math.max(0, pl.invuln - dt)
    pl.jumpBuffer = Math.max(0, pl.jumpBuffer - dt)
    pl.coyote = pl.onGround ? .11 : Math.max(0, pl.coyote - dt)
    if (pl.onGround && this.ground) { pl.x += this.ground.dx; pl.y += this.ground.dy }
    const direction = Number(this.keys.right) - Number(this.keys.left)
    if (direction) pl.facing = direction
    const targetVx = direction * 138
    const accel = pl.onGround ? 1050 : 680
    pl.vx += Math.max(-accel * dt, Math.min(accel * dt, targetVx - pl.vx))
    if (pl.jumpBuffer > 0 && pl.coyote > 0) {
      pl.vy = -315; pl.onGround = false; pl.coyote = 0; pl.jumpBuffer = 0; this.ground = null
      this.callbacks.onSound('move')
      this.burst(pl.x, pl.y, '#9aa5c7', 5)
    }
    const prevY = pl.y
    pl.vy = Math.min(370, pl.vy + 780 * dt)
    pl.x = Math.max(10, Math.min(470, pl.x + pl.vx * dt))
    pl.y += pl.vy * dt
    pl.onGround = false
    this.ground = null
    if (pl.vy >= 0) {
      let landing: Platform | null = null
      for (const p of this.platforms) {
        if (prevY <= p.y + 3 && pl.y >= p.y && pl.x + 7 > p.x && pl.x - 7 < p.x + p.w) {
          if (!landing || p.y < landing.y) landing = p
        }
      }
      if (landing) { pl.y = landing.y; pl.vy = 0; pl.onGround = true; this.ground = landing }
    }

    for (const enemy of this.enemies) {
      if (!enemy.alive) continue
      enemy.x += enemy.vx * dt
      if (enemy.x < enemy.min) { enemy.x = enemy.min; enemy.vx = Math.abs(enemy.vx) }
      if (enemy.x > enemy.max) { enemy.x = enemy.max; enemy.vx = -Math.abs(enemy.vx) }
      const overlap = Math.abs(pl.x - enemy.x) < 17 && pl.y > enemy.y - 15 && pl.y - 22 < enemy.y
      if (!overlap) continue
      if (pl.vy > 55 && prevY <= enemy.y - 10) {
        enemy.alive = false; pl.vy = -215; this.score += 75; this.message = 'Slime diinjak! +75 poin'
        this.burst(enemy.x, enemy.y - 7, '#ff8ca0', 14); this.callbacks.onSound('explosion'); this.emitHud()
      } else this.damage(enemy.x, 'Awas slime! Lompat dan injak dari atas.')
    }

    const playerCenterY = pl.y - 11
    for (const crystal of this.crystals) {
      if (crystal.active && Math.abs(pl.x - crystal.x) < 20 && Math.abs(playerCenterY - crystal.y) < 23) { this.collect(crystal); break }
    }
  }

  private render() {
    const c = this.ctx
    const palette = PALETTES[Math.min(this.wave, PALETTES.length - 1)]
    c.save()
    if (this.shake > 0) c.translate(Math.round(Math.sin(this.time * 90) * this.shake * 3), 0)
    // The same local sky kingdom links all eight rooms; room index drives parallax.
    this.sky.draw(c, 480, 270, this.time, this.wave * 90 + this.player.x * .08, .08)
    c.fillStyle = palette[0] + '22'; c.fillRect(-4, 0, 488, 270)

    for (const p of this.platforms) {
      const x = Math.round(p.x), y = Math.round(p.y)
      c.fillStyle = '#3c425c'; c.fillRect(x, y, p.w, 270 - y)
      c.fillStyle = '#59637a'; c.fillRect(x + 3, y + 5, p.w - 6, 270 - y)
      c.fillStyle = p.speed ? '#ffd85e' : palette[1]; c.fillRect(x, y, p.w, 4)
      c.fillStyle = p.speed ? '#fff0a6' : palette[2]; c.fillRect(x, y, p.w, 1)
      c.fillStyle = '#343a52'
      for (let bx = x + 5; bx < x + p.w - 3; bx += 17) c.fillRect(bx, y + 9, 8, 3)
      c.fillStyle = '#8fd27a'
      for (let bx = x + 8; bx < x + p.w - 3; bx += 29) c.fillRect(bx, y - 2, 2, 2)
    }

    for (const crystal of this.crystals) {
      if (!crystal.active) continue
      const x = Math.round(crystal.x), y = Math.round(crystal.y + Math.sin(this.time * 4 + crystal.x) * 2)
      c.fillStyle = '#7887ff33'; c.fillRect(x - 25, y - 18, 50, 36)
      c.fillStyle = '#7887ff'
      c.beginPath(); c.moveTo(x, y - 18); c.lineTo(x + 27, y); c.lineTo(x, y + 18); c.lineTo(x - 27, y); c.closePath(); c.fill()
      c.fillStyle = '#172033'; c.fillRect(x - 21, y - 8, 42, 16)
      c.fillStyle = '#fff'; c.font = 'bold 12px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(crystal.label, x, y + 1)
    }

    for (const e of this.enemies) {
      if (!e.alive) continue
      const x = Math.round(e.x), y = Math.round(e.y), bob = Math.round(Math.sin(this.time * 7 + e.x) * 1.5)
      c.fillStyle = '#d95376'; c.fillRect(x - 10, y - 11 + bob, 20, 11 - bob); c.fillRect(x - 7, y - 15 + bob, 14, 5)
      c.fillStyle = '#fff'; c.fillRect(x - 6, y - 10 + bob, 4, 4); c.fillRect(x + 3, y - 10 + bob, 4, 4)
      c.fillStyle = '#202238'; c.fillRect(x - 5 + (e.vx > 0 ? 1 : 0), y - 9 + bob, 2, 2); c.fillRect(x + 4 + (e.vx > 0 ? 1 : 0), y - 9 + bob, 2, 2)
    }

    const pl = this.player
    if (!(pl.invuln > 0 && Math.floor(this.time * 14) % 2 === 0)) {
      const x = Math.round(pl.x), y = Math.round(pl.y)
      const walk = pl.onGround && Math.abs(pl.vx) > 15 ? Math.round(Math.sin(this.time * 14) * 2) : 0
      c.fillStyle = '#202238'; c.fillRect(x - 8, y - 7 + walk, 6, 7 - walk); c.fillRect(x + 3, y - 7 - walk, 6, 7 + walk)
      c.fillStyle = '#596dff'; c.fillRect(x - 10, y - 21, 20, 15)
      c.fillStyle = '#f4c7a6'; c.fillRect(x - 8, y - 34, 16, 13)
      c.fillStyle = '#242238'; c.fillRect(x - 10, y - 38, 20, 7); c.fillRect(x - 10, y - 33, 4, 7)
      c.fillStyle = '#fff'; c.fillRect(x - 5, y - 28, 3, 3); c.fillRect(x + 4, y - 28, 3, 3)
      c.fillStyle = '#ffcf4a'; c.fillRect(pl.facing > 0 ? x + 10 : x - 20, y - 20, 11, 4)
    }
    for (const p of this.particles) {
      if (!p.active) continue
      c.fillStyle = p.color; c.fillRect(Math.round(p.x), Math.round(p.y), 3, 3)
    }
    if (this.transition > 0) {
      c.fillStyle = '#101018bb'; c.fillRect(145, 105, 190, 45)
      c.fillStyle = '#62f5c8'; c.font = 'bold 12px monospace'; c.textAlign = 'center'; c.fillText('AREA SELESAI!', 240, 125)
      c.fillStyle = '#fff'; c.font = 'bold 9px monospace'; c.fillText('Naik ke area berikutnya…', 240, 140)
    }
    if (this.paused) { c.fillStyle = '#0a0a1499'; c.fillRect(0, 0, 480, 270) }
    c.restore()
  }

  dispose() {
    this.loop.stop()
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('blur', this.clearKeys)
    delete window.__arcadeProbe
  }
}
