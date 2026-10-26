import { GameLoop } from './engine'
import { SkyBackdrop } from './sky'

declare global {
  interface Window { __GAME_READY__?: boolean }
}

type Session = { dispose: () => void }
let session: Session | null = null

export function startGame(canvas: HTMLCanvasElement): void {
  stopGame()
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.imageSmoothingEnabled = false
  const sky = new SkyBackdrop()
  let time = 0
  let flash = 0
  let w = 320, h = 180

  const resize = () => {
    const aspect = Math.max(.45, window.innerWidth / Math.max(1, window.innerHeight))
    h = 180
    w = Math.max(160, Math.min(420, Math.round(h * aspect)))
    canvas.width = w
    canvas.height = h
    ctx.imageSmoothingEnabled = false
  }
  resize()
  const onCelebrate = () => { flash = .45 }
  window.addEventListener('resize', resize)
  window.addEventListener('fraction-celebrate', onCelebrate)

  const loop = new GameLoop({
    update: dt => { time += dt; flash = Math.max(0, flash - dt) },
    render: () => {
      sky.draw(ctx, w, h, time, 0, flash > 0 ? Math.min(.16, flash * .3) : 0)
      if (flash > 0) {
        ctx.fillStyle = `rgba(255,232,148,${Math.min(.28, flash * .5)})`
        ctx.fillRect(0, 0, w, h)
      }
      window.__GAME_READY__ = true
    },
  })
  loop.start()
  session = { dispose: () => {
    loop.stop()
    window.removeEventListener('resize', resize)
    window.removeEventListener('fraction-celebrate', onCelebrate)
    window.__GAME_READY__ = false
  } }
}

export function stopGame(): void { session?.dispose(); session = null }
