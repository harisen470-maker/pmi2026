const SKY_URL = `${import.meta.env.BASE_URL}assets/langit-pecahan.png`

/** Shared, local-only panorama with lightweight procedural parallax and a full fallback. */
export class SkyBackdrop {
  private image: HTMLImageElement | null = null
  private loaded = false
  private failed = false

  constructor() {
    const image = new Image()
    this.image = image
    image.onload = () => { this.loaded = image.naturalWidth > 0 }
    image.onerror = () => { this.failed = true; this.loaded = false }
    image.src = SKY_URL
  }

  get status() { return this.loaded ? 'ready' : this.failed ? 'fallback' : 'loading' }

  draw(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, scroll = 0, shade = 0) {
    ctx.imageSmoothingEnabled = false
    ctx.fillStyle = '#69cde0'
    ctx.fillRect(0, 0, w, h)

    const image = this.image
    if (this.loaded && image) {
      // Cover cropping preserves the 16:9 artwork without distortion on every screen.
      const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight)
      const dw = Math.ceil(image.naturalWidth * scale)
      const dh = Math.ceil(image.naturalHeight * scale)
      const drift = Math.sin(time * 0.035 + scroll * 0.01) * Math.min(8, w * 0.018)
      const x = Math.round((w - dw) * 0.5 + drift - scroll * 0.08)
      const y = Math.round((h - dh) * 0.5)
      ctx.drawImage(image, x, y, dw, dh)
    } else {
      this.drawFallback(ctx, w, h, time, scroll)
    }

    this.drawParallax(ctx, w, h, time, scroll)
    if (shade > 0) {
      ctx.fillStyle = `rgba(13,34,57,${shade})`
      ctx.fillRect(0, 0, w, h)
    }
  }

  private drawFallback(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, scroll: number) {
    ctx.fillStyle = '#78d9e9'; ctx.fillRect(0, 0, w, h * 0.58)
    ctx.fillStyle = '#a9e5e8'; ctx.fillRect(0, h * 0.58, w, h * 0.42)
    ctx.fillStyle = '#789fc4'
    for (let i = 0; i < 6; i++) {
      const x = ((i * w * 0.24 - scroll * 0.05) % (w * 1.3)) - w * 0.12
      ctx.beginPath(); ctx.moveTo(x, h * 0.82); ctx.lineTo(x + w * 0.16, h * 0.46); ctx.lineTo(x + w * 0.31, h * 0.82); ctx.fill()
    }
    this.drawIsland(ctx, w * 0.12, h * 0.35, w * 0.22, h * 0.12)
    this.drawIsland(ctx, w * 0.73, h * 0.25, w * 0.2, h * 0.1)
    ctx.strokeStyle = '#f7d36b'; ctx.lineWidth = Math.max(2, h * 0.012)
    ctx.beginPath(); ctx.arc(w * 0.55, h * 0.58, w * 0.24, Math.PI * 1.08, Math.PI * 1.75); ctx.stroke()
    ctx.strokeStyle = '#ed8fbc'; ctx.lineWidth = Math.max(1, h * 0.006)
    ctx.beginPath(); ctx.arc(w * 0.55, h * 0.58, w * 0.22, Math.PI * 1.08, Math.PI * 1.75); ctx.stroke()
    // A tiny moving waterfall makes the fallback feel like the same world.
    ctx.fillStyle = '#c9ffff'
    const drop = Math.floor(time * 18) % 20
    ctx.fillRect(Math.round(w * 0.27), Math.round(h * 0.38 + drop), 2, 6)
  }

  private drawParallax(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, scroll: number) {
    ctx.save()
    // Far clouds and near clouds move at different rates over the panorama.
    ctx.globalAlpha = 0.18
    ctx.fillStyle = '#ffffff'
    for (let i = 0; i < 5; i++) {
      const span = w + 100
      const x = ((i * 137 + time * 1.2 - scroll * 0.04) % span + span) % span - 50
      const y = h * (0.13 + (i % 3) * 0.17)
      this.cloud(ctx, Math.round(x), Math.round(y), i % 2 ? 0.75 : 1)
    }
    ctx.globalAlpha = 0.28
    for (let i = 0; i < 3; i++) {
      const span = w + 140
      const x = ((i * 223 - time * 2.2 - scroll * 0.16) % span + span) % span - 70
      this.cloud(ctx, Math.round(x), Math.round(h * (0.7 + i * 0.07)), 1.2)
    }
    // Sparse square glints, deterministic and allocation-free in the frame loop.
    ctx.globalAlpha = 0.7
    for (let i = 0; i < 18; i++) {
      const x = Math.round((i * 83 + time * (2 + i % 3)) % w)
      const y = Math.round((i * 47 + Math.sin(time * 0.8 + i) * 5 + h) % h)
      ctx.fillStyle = i % 3 ? '#e8ffff' : '#ffe79a'
      ctx.fillRect(x, y, i % 4 === 0 ? 2 : 1, i % 4 === 0 ? 2 : 1)
    }
    ctx.restore()
  }

  private cloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
    const u = Math.max(2, Math.round(5 * scale))
    ctx.fillRect(x, y, u * 10, u * 2)
    ctx.fillRect(x + u * 2, y - u, u * 6, u * 2)
    ctx.fillRect(x + u * 4, y - u * 2, u * 3, u * 2)
  }

  private drawIsland(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.fillStyle = '#55aa67'; ctx.fillRect(x, y, w, Math.max(3, h * 0.18))
    ctx.fillStyle = '#68718e'
    ctx.beginPath(); ctx.moveTo(x, y + h * 0.18); ctx.lineTo(x + w, y + h * 0.18); ctx.lineTo(x + w * 0.55, y + h); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#75e4e5'; ctx.fillRect(x + w * 0.72, y + h * 0.18, Math.max(2, w * 0.06), h * 0.9)
  }
}
