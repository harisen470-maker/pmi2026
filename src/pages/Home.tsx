import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, CircleHelp, Gamepad2, Heart, Home as HomeIcon, Lightbulb, LockKeyhole, Map, Pause, Play, RotateCcw, Shuffle, SlidersHorizontal, Sparkles, Star, Trophy, Volume2, VolumeX, X, Zap } from 'lucide-react'
import { startGame, stopGame } from '@/game/boot'
import { FractionArcade, type ArcadeHud } from '@/game/arcade'
import { AudioSystem } from '@/game/audio'
import { levels, lessons, type Question } from '@/game/content'
import { storage } from '@/game/storage'

type Screen = 'title' | 'map' | 'learn' | 'play' | 'arcade' | 'levelComplete' | 'victory' | 'gameOver' | 'arcadeResult'
type Modal = 'guide' | 'lesson' | 'pause' | null
type Progress = { unlocked: number; stars: Record<number, number>; best: number; arcadeBest: number }
const defaultProgress: Progress = { unlocked: 0, stars: {}, best: 0, arcadeBest: 0 }

function Fraction({ value }: { value: [number, number] }) {
  return <span className="fraction"><b>{value[0]}</b><i /><b>{value[1]}</b></span>
}

function Pizza({ value, color = '#ffcc4d' }: { value: [number, number]; color?: string }) {
  const [n, d] = value
  return <svg viewBox="0 0 120 120" className="pizza" role="img" aria-label={`Visual ${n} per ${d}`}>
    <circle cx="60" cy="60" r="56" fill="#151523" stroke="#68708e" strokeWidth="3" />
    {Array.from({ length: d }, (_, i) => {
      const a0 = (i / d) * Math.PI * 2 - Math.PI / 2
      const a1 = ((i + 1) / d) * Math.PI * 2 - Math.PI / 2
      const x0 = 60 + Math.cos(a0) * 51, y0 = 60 + Math.sin(a0) * 51
      const x1 = 60 + Math.cos(a1) * 51, y1 = 60 + Math.sin(a1) * 51
      return <path key={i} d={`M60 60 L${x0} ${y0} A51 51 0 0 1 ${x1} ${y1} Z`} fill={i < n ? color : '#292b42'} stroke="#11111c" strokeWidth="2" />
    })}
  </svg>
}

function Bars({ value, color = '#7887ff' }: { value: [number, number]; color?: string }) {
  const [n, d] = value
  return <div className="bar-wrap"><div className="fraction-bar">{Array.from({ length: d }, (_, i) => <span key={i} style={{ background: i < n ? color : '#292b42' }} />)}</div><Fraction value={value} /></div>
}

function Visual({ q }: { q: Question }) {
  const first = q.fraction || [1, 2]
  const symbol = q.operation || (q.compare ? '+' : '')
  if (q.visual === 'pizza') return <div className="visual-pair"><div><Pizza value={first} /><Fraction value={first} /></div>{q.compare && <><span className="visual-symbol">{symbol}</span><div><Pizza value={q.compare} color="#7887ff" /><Fraction value={q.compare} /></div></>}</div>
  if (q.visual === 'bars' || q.visual === 'candy') return <div className="visual-bars"><Bars value={first} />{q.compare && <><span className="visual-symbol">{symbol}</span><Bars value={q.compare} color="#52d9bd" /></>}</div>
  if (q.visual === 'kpk') return <div className="kpk-visual"><div><b>4</b><span>4</span><span>8</span><span className="lit">12</span><span>16</span></div><div><b>6</b><span>6</span><span className="lit">12</span><span>18</span><span>24</span></div></div>
  if (q.visual === 'ribbon') return <div className="ribbon-visual"><div className="ribbon"><i /><i /><i /><i className="empty" /></div><div className="ribbon-labels"><span>dipakai 1/2 m</span><b>sisa 1/4 m?</b></div><small>Panjang awal: 3/4 meter</small></div>
  if (q.visual === 'recipe') return <div className="recipe-visual"><div className="jar">✦<span>GULA</span></div><div className="recipe-card"><span>RESEP PIKSEL</span><b>{first[0]}/{first[1]} {q.compare ? `${q.operation} ${q.compare[0]}/${q.compare[1]}` : ''}</b><i>Ukur dengan teliti!</i></div></div>
  return <div className="bottle-visual"><div className="water-jar"><span>4½ L</span><i /></div><ChevronRight /><div className="bottles">{Array.from({ length: 6 }, (_, i) => <span key={i}>¾</span>)}</div></div>
}

function ArcadePanel({ paused, onEnd, onSound }: { paused: boolean; onEnd: (result: 'win' | 'lose', score: number) => void; onSound: (id: 'move' | 'explosion' | 'pickup' | 'hit' | 'win' | 'lose') => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<FractionArcade | null>(null)
  const [hud, setHud] = useState<ArcadeHud>({ score: 0, hearts: 3, wave: 0, combo: 0, target: '1/2', message: 'Bergerak dengan A/D, lompat dengan Spasi.', roomName: 'Kaki Gunung' })
  useEffect(() => {
    if (!canvasRef.current) return
    const game = new FractionArcade(canvasRef.current, { onHud: setHud, onEnd, onSound })
    gameRef.current = game
    return () => { game.dispose(); gameRef.current = null }
  }, [onEnd, onSound])
  useEffect(() => { gameRef.current?.setPaused(paused) }, [paused])
  const hold = (direction: -1 | 0 | 1) => ({
    onPointerDown: (e: PointerEvent) => { e.preventDefault(); gameRef.current?.setDirection(direction) },
    onPointerUp: () => gameRef.current?.setDirection(0),
    onPointerLeave: () => gameRef.current?.setDirection(0),
    onPointerCancel: () => gameRef.current?.setDirection(0),
  })
  return <div className="arcade-wrap">
    <div className="arcade-hud"><div><small>AREA {Math.min(hud.wave + 1, 8)}/8</small><b>{hud.roomName}</b></div><div className="arcade-target"><small>CARI SENILAI</small><strong>{hud.target}</strong></div><div><small>SKOR</small><b>{hud.score}</b></div><div className="hearts">{[0, 1, 2].map(i => <Heart key={i} size={19} fill={i < hud.hearts ? 'currentColor' : 'none'} className={i < hud.hearts ? '' : 'lost'} />)}</div></div>
    <div className="arcade-stage"><canvas ref={canvasRef} id="arcade-canvas" aria-label="Game menangkap kristal pecahan" />{hud.combo > 1 && <span className="combo"><Zap size={14} /> COMBO ×{hud.combo}</span>}</div>
    <p className="arcade-message">{hud.message}</p>
    <div className="touch-controls"><button {...hold(-1)} aria-label="Gerak ke kiri"><ArrowLeft /> KIRI</button><span>A/D bergerak • Spasi melompat<br />Injak slime dari atas!</span><button className="jump-btn" onPointerDown={e => { e.preventDefault(); gameRef.current?.jump() }} onPointerUp={() => gameRef.current?.releaseJump()} aria-label="Lompat">LOMPAT ↑</button><button {...hold(1)} aria-label="Gerak ke kanan">KANAN <ArrowRight /></button></div>
  </div>
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<AudioSystem | null>(null)
  const [screen, setScreen] = useState<Screen>('title')
  const [modal, setModal] = useState<Modal>(null)
  const [progress, setProgress] = useState<Progress>(() => {
    const p = storage.get<Progress>('fractionProgressV2', defaultProgress)
    return p && Number.isInteger(p.unlocked) && p.stars ? { unlocked: Math.max(0, Math.min(4, p.unlocked)), stars: p.stars, best: Math.max(0, p.best || 0), arcadeBest: Math.max(0, p.arcadeBest || 0) } : defaultProgress
  })
  const [levelIndex, setLevelIndex] = useState(0)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [hearts, setHearts] = useState(3)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [hint, setHint] = useState(false)
  const [muted, setMuted] = useState(false)
  const [lastStars, setLastStars] = useState(0)
  const [shake, setShake] = useState(false)
  const [labN, setLabN] = useState(3)
  const [labD, setLabD] = useState(4)
  const [labView, setLabView] = useState<'pizza' | 'bars' | 'line'>('pizza')
  const [arcadeResult, setArcadeResult] = useState<'win' | 'lose'>('lose')

  const level = levels[levelIndex]
  const question = level.questions[questionIndex]
  const answered = selected !== null
  const correct = selected === question.answer
  const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a
  const labGcd = gcd(labN, labD)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    startGame(canvas)
    const audio = new AudioSystem()
    audioRef.current = audio
    setMuted(audio.muted)
    return () => { stopGame(); audio.dispose(); audioRef.current = null }
  }, [])
  useEffect(() => { storage.set('fractionProgressV2', progress) }, [progress])
  useEffect(() => {
    if (labN > labD) setLabN(labD)
  }, [labD, labN])

  const sfx = useCallback((id: 'ui' | 'move' | 'explosion' | 'pickup' | 'hit' | 'win' | 'lose') => audioRef.current?.sfx(id), [])
  const arcadeSound = useCallback((id: 'move' | 'explosion' | 'pickup' | 'hit' | 'win' | 'lose') => sfx(id), [sfx])
  const go = useCallback((next: Screen) => { setScreen(next); setModal(null); sfx('ui') }, [sfx])
  const startLevel = useCallback((index: number) => {
    setLevelIndex(index); setQuestionIndex(0); setSelected(null); setHearts(3); setCombo(0); setMistakes(0); setHint(false); setScore(0); setScreen('play'); setModal(null); sfx('ui')
  }, [sfx])
  const startArcade = useCallback(() => { setScore(0); setScreen('arcade'); setModal(null); sfx('ui') }, [sfx])
  const finishArcade = useCallback((result: 'win' | 'lose', finalScore: number) => {
    setArcadeResult(result); setScore(finalScore)
    setProgress(p => ({ ...p, arcadeBest: Math.max(p.arcadeBest, finalScore) }))
    setScreen('arcadeResult')
  }, [])

  const next = useCallback(() => {
    if (!answered) return
    if (hearts <= 0) { setScreen('gameOver'); sfx('lose'); return }
    if (questionIndex < level.questions.length - 1) {
      setQuestionIndex(v => v + 1); setSelected(null); setHint(false); sfx('ui')
    } else {
      const earned = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1
      setLastStars(earned)
      setProgress(p => ({ ...p, unlocked: Math.max(p.unlocked, Math.min(4, levelIndex + 1)), stars: { ...p.stars, [levelIndex]: Math.max(p.stars[levelIndex] || 0, earned) }, best: Math.max(p.best, score) }))
      setScreen(levelIndex === levels.length - 1 ? 'victory' : 'levelComplete'); sfx('win')
      window.dispatchEvent(new Event('fraction-celebrate'))
    }
  }, [answered, hearts, questionIndex, level, mistakes, score, levelIndex, sfx])
  const answer = useCallback((index: number) => {
    if (selected !== null || screen !== 'play' || modal) return
    setSelected(index)
    if (index === question.answer) {
      setCombo(c => c + 1); setScore(s => s + 100 + combo * 20); sfx('pickup'); window.dispatchEvent(new Event('fraction-celebrate'))
    } else {
      setCombo(0); setHearts(h => Math.max(0, h - 1)); setMistakes(m => m + 1); sfx('hit'); setShake(true); window.setTimeout(() => setShake(false), 350)
    }
  }, [selected, screen, modal, question, combo, sfx])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'm') { const m = audioRef.current?.toggleMute(); if (m !== undefined) setMuted(m) }
      if (e.key === 'Escape') { if (modal) setModal(null); else if (screen === 'play' || screen === 'arcade') setModal('pause') }
      if (screen === 'title' && (e.code === 'Space' || e.key === 'Enter')) { e.preventDefault(); go('map') }
      if (screen === 'play' && !modal) {
        if (['1', '2', '3', '4'].includes(e.key)) answer(Number(e.key) - 1)
        if (e.key === 'Enter' && answered) next()
        if (e.key.toLowerCase() === 'h' && !answered) setHint(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [screen, modal, answered, answer, next, go])
  const toggleMute = () => { const m = audioRef.current?.toggleMute(); if (m !== undefined) setMuted(m) }

  return <div id="game-root" className={`screen-${screen}`}>
    <canvas id="game-canvas" ref={canvasRef} />
    <div className="ambient-grain" />
    <div id="ui-overlay">
      <header className="topbar">
        <button className="brand" onClick={() => go('title')} aria-label="Ke beranda"><span className="brand-mark">½</span><span><b>PIXEL</b><strong>PECAHAN</strong></span></button>
        <div className="top-actions">
          {screen !== 'title' && screen !== 'map' && <button className="icon-btn" onClick={() => go('map')} aria-label="Peta misi"><Map size={19} /></button>}
          <button className="icon-btn" onClick={() => setModal('lesson')} aria-label="Materi ringkas"><BookOpen size={19} /></button>
          <button className="icon-btn" onClick={toggleMute} aria-label={muted ? 'Nyalakan suara' : 'Matikan suara'}>{muted ? <VolumeX size={19} /> : <Volume2 size={19} />}</button>
          {(screen === 'play' || screen === 'arcade') && <button className="icon-btn" onClick={() => setModal('pause')} aria-label="Jeda"><Pause size={19} /></button>}
        </div>
      </header>

      {screen === 'title' && <main className="title-screen screen-enter">
        <div className="eyebrow"><Sparkles size={14} /> PETUALANGAN MATEMATIKA PIXEL</div>
        <h1>PENJAGA<br /><em>PECAHAN</em></h1>
        <p>Belajar lewat visual. Jelajahi kerajaan langit lewat permainan.</p>
        <button className="start-btn" onClick={() => go('map')}><Play size={20} fill="currentColor" /> START</button>
        <div className="title-links"><button onClick={() => go('learn')}><SlidersHorizontal size={16} /> Lab Visual</button><button onClick={() => setModal('guide')}><CircleHelp size={16} /> Cara Main</button></div>
        <span className="keyboard-hint">TEKAN <kbd>SPASI</kbd> UNTUK MULAI</span>
      </main>}

      {screen === 'map' && <main className="map-screen screen-enter">
        <div className="section-heading"><div><span className="eyebrow">PETA PETUALANGAN</span><h2>Pilih caramu belajar</h2><p>Selesaikan misi kuis atau langsung main di arena.</p></div><div className="total-badge"><Trophy size={19} /><span>REKOR<b>{progress.best.toLocaleString('id-ID')}</b></span></div></div>
        <div className="mode-grid"><button className="mode-card lab" onClick={() => go('learn')}><SlidersHorizontal /><div><small>MEDIA VISUAL</small><h3>Lab Pecahan</h3><p>Ubah pembilang & penyebut, lihat gambarnya.</p></div><ChevronRight /></button><button className="mode-card arcade" onClick={startArcade}><Gamepad2 /><div><small>MINI-GAME</small><h3>Ekspedisi Puncak</h3><p>Lompat, injak slime, dan taklukkan 8 area!</p></div><span className="best">BEST {progress.arcadeBest}</span><ChevronRight /></button></div>
        <div className="level-path">{levels.map((l, i) => {
          const locked = i > progress.unlocked
          const stars = progress.stars[i] || 0
          return <button key={l.id} className={`level-card ${locked ? 'locked' : ''}`} style={{ '--level': l.color } as CSSProperties} disabled={locked} onClick={() => startLevel(i)}>
            <div className="level-number">{locked ? <LockKeyhole size={21} /> : <span>{l.icon}</span>}</div><div className="level-copy"><small>MISI {i + 1}</small><h3>{l.name}</h3><p>{l.skill}</p></div><div className="level-stars">{[1, 2, 3].map(s => <Star key={s} size={14} fill={s <= stars ? 'currentColor' : 'none'} />)}</div>{!locked && <ChevronRight className="level-arrow" size={18} />}
          </button>
        })}</div>
        <div className="map-footer"><span><Star size={15} /> {Object.values(progress.stars).reduce((a, b) => a + b, 0)}/15 bintang</span><button onClick={() => go('title')}><HomeIcon size={15} /> Beranda</button></div>
      </main>}

      {screen === 'learn' && <main className="learn-screen screen-enter">
        <div className="section-heading"><div><span className="eyebrow">LAB PECAHAN INTERAKTIF</span><h2>Lihat pecahan, bukan hanya angka</h2><p>Geser pengatur dan amati bagian yang berubah.</p></div><button className="secondary-btn" onClick={() => { const d = labD >= 9 ? 2 : labD + 1; setLabD(d); setLabN((labN % d) + 1) }}><Shuffle size={16} /> Acak</button></div>
        <section className="lab-card">
          <div className="lab-visual">
            {labView === 'pizza' && <Pizza value={[labN, labD]} color="#ffcc4d" />}
            {labView === 'bars' && <Bars value={[labN, labD]} color="#7887ff" />}
            {labView === 'line' && <div className="number-line"><div className="line-segments">{Array.from({ length: labD }, (_, i) => <i key={i} className={i < labN ? 'filled' : ''} />)}</div><div className="line-labels"><span>0</span><b>{labN}/{labD}</b><span>1</span></div></div>}
            <Fraction value={[labN, labD]} />
          </div>
          <div className="lab-controls">
            <div className="view-tabs">{(['pizza', 'bars', 'line'] as const).map(v => <button key={v} className={labView === v ? 'active' : ''} onClick={() => setLabView(v)}>{v === 'pizza' ? 'LINGKARAN' : v === 'bars' ? 'BALOK' : 'GARIS'}</button>)}</div>
            <label><span>PEMBILANG <b>{labN}</b></span><input type="range" min="1" max={labD} value={labN} onChange={e => setLabN(Number(e.target.value))} /><small>Bagian yang diwarnai</small></label>
            <label><span>PENYEBUT <b>{labD}</b></span><input type="range" min="2" max="12" value={labD} onChange={e => setLabD(Number(e.target.value))} /><small>Total bagian sama besar</small></label>
            <div className="lab-facts"><div><small>DESIMAL</small><b>{(labN / labD).toFixed(2).replace('.', ',')}</b></div><div><small>PERSEN</small><b>{Math.round(labN / labD * 100)}%</b></div><div><small>PALING SEDERHANA</small><b>{labN / labGcd}/{labD / labGcd}</b></div></div>
          </div>
        </section>
        <div className="learn-tip"><Lightbulb size={18} /><p><b>Coba temukan pola!</b> Jika pembilang dan penyebut dikali dua, warna yang terisi tetap sama. Contoh: 1/2 = 2/4.</p><button className="primary-btn" onClick={() => go('map')}>Coba Misi <ChevronRight size={17} /></button></div>
      </main>}

      {screen === 'play' && <main className={`play-screen screen-enter ${shake ? 'shake' : ''}`}>
        <div className="hud"><div className="mission-label"><span style={{ background: level.color }}>{level.icon}</span><div><small>MISI {levelIndex + 1} • {level.short}</small><b>{level.name}</b></div></div><div className="hud-right"><div className="hearts">{[0, 1, 2].map(i => <Heart key={i} size={20} fill={i < hearts ? 'currentColor' : 'none'} className={i < hearts ? '' : 'lost'} />)}</div><div className="score"><Zap size={17} />{score}</div></div></div>
        <div className="progress-track"><i style={{ width: `${((questionIndex + (answered ? 1 : 0)) / level.questions.length) * 100}%`, background: level.color }} /></div>
        <section className="question-card">
          <div className="question-top"><span className="question-count">TANTANGAN {questionIndex + 1} <i>/ {level.questions.length}</i></span>{combo > 1 && !answered && <span className="combo"><Zap size={14} /> COMBO ×{combo}</span>}</div>
          {question.context && <span className="context-tag">{question.context}</span>}<h2>{question.prompt}</h2>
          <div className="question-content"><div className="math-visual"><Visual q={question} /></div><div className="answers">{question.options.map((option, i) => {
            let cls = ''
            if (answered && i === question.answer) cls = 'correct'; else if (answered && i === selected) cls = 'wrong'; else if (answered) cls = 'dimmed'
            return <button key={i} className={`answer-btn ${cls}`} onClick={() => answer(i)} disabled={answered}><span className="answer-key">{i + 1}</span><b>{option}</b>{answered && i === question.answer && <span>✓</span>}{answered && i === selected && i !== question.answer && <span>×</span>}</button>
          })}</div></div>
          {!answered ? <div className="question-footer"><button className="hint-btn" onClick={() => setHint(v => !v)}><Lightbulb size={17} /> {hint ? 'Tutup petunjuk' : 'Butuh petunjuk?'}</button><span>Tekan <kbd>1</kbd>–<kbd>4</kbd> untuk menjawab</span></div> : <div className={`feedback ${correct ? 'good' : 'bad'}`}><span className="feedback-icon">{correct ? '★' : '?'}</span><div><b>{correct ? 'TEPAT! ENERGI BERTAMBAH' : 'BELUM TEPAT, YUK PAHAMI'}</b><p>{question.explanation}</p></div><button className="primary-btn" onClick={next}>{hearts <= 0 ? 'Lihat Hasil' : questionIndex === level.questions.length - 1 ? 'Selesai' : 'Lanjut'}<ChevronRight size={18} /></button></div>}
          {hint && !answered && <div className="hint-box"><Lightbulb size={18} /><p><b>Petunjuk:</b> {question.hint}</p></div>}
        </section>
      </main>}

      {screen === 'arcade' && <main className="arcade-screen screen-enter"><div className="section-heading compact"><div><span className="eyebrow">MINI-GAME • PANJAT PUNCAK</span><h2>Ekspedisi Puncak</h2></div><span className="arcade-best"><Trophy size={16} /> BEST {progress.arcadeBest}</span></div><ArcadePanel paused={modal === 'pause'} onEnd={finishArcade} onSound={arcadeSound} /></main>}

      {(screen === 'levelComplete' || screen === 'victory') && <main className="result-screen screen-enter"><div className="result-card"><div className="result-burst"><Trophy size={40} /></div><span className="eyebrow">{screen === 'victory' ? 'PUNCAK DITAKLUKKAN!' : 'MISI SELESAI'}</span><h2>{screen === 'victory' ? 'Kamu Penjaga Pecahan!' : `${level.name} selesai!`}</h2><p>{screen === 'victory' ? 'Semua misi selesai. Sekarang coba rekor baru di arena Ekspedisi Puncak!' : 'Misi berikutnya terbuka. Terus naik!'}</p><div className="earned-stars">{[1, 2, 3].map(s => <Star key={s} size={40} fill={s <= lastStars ? 'currentColor' : 'none'} />)}</div><div className="result-stats"><div><span>SKOR</span><b>{score}</b></div><div><span>KETEPATAN</span><b>{Math.round((3 - mistakes) / 3 * 100)}%</b></div><div><span>BINTANG</span><b>{Object.values(progress.stars).reduce((a, b) => a + b, 0)}/15</b></div></div><div className="result-actions">{screen === 'levelComplete' && <button className="primary-btn big" onClick={() => startLevel(levelIndex + 1)}>Misi Berikutnya <ChevronRight size={18} /></button>}<button className="secondary-btn" onClick={() => go('map')}>Kembali ke Peta</button></div></div></main>}

      {screen === 'gameOver' && <main className="result-screen screen-enter"><div className="result-card"><div className="result-burst danger"><Heart size={38} /></div><span className="eyebrow">ENERGI HABIS</span><h2>Coba lagi, kamu pasti bisa!</h2><p>Buka petunjuk atau pelajari visualnya dulu. Kesalahan adalah bagian dari belajar.</p><div className="result-actions"><button className="primary-btn big" onClick={() => startLevel(levelIndex)}><RotateCcw size={18} /> Ulangi Misi</button><button className="secondary-btn" onClick={() => go('learn')}>Lab Visual</button></div></div></main>}

      {screen === 'arcadeResult' && <main className="result-screen screen-enter"><div className="result-card"><div className={`result-burst ${arcadeResult === 'lose' ? 'danger' : ''}`}>{arcadeResult === 'win' ? <Trophy size={40} /> : <Gamepad2 size={38} />}</div><span className="eyebrow">{arcadeResult === 'win' ? 'PUNCAK TERCAPAI!' : 'PERCOBAAN SELESAI'}</span><h2>{arcadeResult === 'win' ? '8 kristal berhasil dikumpulkan!' : 'Sedikit lagi menuju puncak!'}</h2><p>Skor kamu <b>{score}</b> • Rekor <b>{progress.arcadeBest}</b></p><div className="result-actions"><button className="primary-btn big" onClick={startArcade}><RotateCcw size={18} /> Main Lagi</button><button className="secondary-btn" onClick={() => go('map')}>Peta</button></div></div></main>}

      {modal && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(null) }}><section className={`modal ${modal === 'lesson' ? 'lesson-modal' : ''}`} role="dialog" aria-modal="true"><button className="modal-close" onClick={() => setModal(null)} aria-label="Tutup"><X /></button>
        {modal === 'guide' && <><span className="eyebrow">PANDUAN PEMAIN</span><h2>Belajar sambil bergerak</h2><div className="guide-list"><div><span>01</span><p><b>Lab Visual</b>Geser pembilang dan penyebut untuk melihat arti pecahan.</p></div><div><span>02</span><p><b>Misi Kuis</b>Pilih jawaban dengan klik atau tombol 1–4. Tekan H untuk petunjuk.</p></div><div><span>03</span><p><b>Ekspedisi Puncak</b>A/D bergerak, Spasi melompat. Injak slime dan cari kristal senilai.</p></div><div><span>04</span><p><b>Istirahat kapan saja</b>Tekan Esc untuk jeda dan M untuk suara.</p></div></div><button className="primary-btn big full" onClick={() => go('map')}>Siap! <ChevronRight size={18} /></button></>}
        {modal === 'lesson' && <><span className="eyebrow">BEKAL PENJAGA</span><h2>Materi Ringkas</h2><div className="lesson-list">{lessons.map((l, i) => <details key={l.title} open={i === levelIndex}><summary><span>{i + 1}</span><b>{l.title}</b><ChevronRight size={17} /></summary><div><code>{l.formula}</code><p>{l.text}</p></div></details>)}</div><p className="lesson-note">Sederhanakan hasil akhir pecahan jika memungkinkan.</p></>}
        {modal === 'pause' && <><div className="pause-icon"><Pause /></div><span className="eyebrow">PERMAINAN DIJEDA</span><h2>Ambil napas sebentar</h2><p>Progres di layar ini aman sampai kamu kembali.</p><button className="primary-btn big full" onClick={() => setModal(null)}><Play size={18} /> Lanjutkan</button><button className="secondary-btn full" onClick={screen === 'arcade' ? startArcade : () => startLevel(levelIndex)}><RotateCcw size={17} /> Ulangi</button><button className="text-btn" onClick={() => go('map')}>Kembali ke peta</button></>}
      </section></div>}
      <div className="save-note">PROGRES TERSIMPAN DI BROWSER INI</div>
      {screen === 'title' && (progress.unlocked > 0 || progress.arcadeBest > 0) && <button className="reset-link" onClick={() => { if (window.confirm('Hapus seluruh progres dan rekor?')) { setProgress(defaultProgress); sfx('ui') } }}>Atur ulang progres</button>}
    </div>
  </div>
}
