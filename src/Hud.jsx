// The panels around the isometric view: the digital studio clock, the three tasks, the tray
// with the things you own right now, the "time stands still" effect while the daemon is awake,
// and the end of the day.

import { useMemo } from 'react'
import { DAY_END, DAY_START, STUDIO_MINUTES_PER_SECOND, canDo, formatTime, game, useGame } from './game.js'
import { KINDS, LABEL } from './belongings.js'
import { PEOPLE } from './studio.js'
import { TASKS } from './tasks.js'
import { BLUE, INK, MINT, PAPER, RED, STEEL, YELLOW } from './palette.js'

const NAME = Object.fromEntries(PEOPLE.map((p) => [p.id, p.name]))

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI']

// The digital clock, with a countdown to the next time the cuckoo strikes.
export function ClockPanel() {
  const { minute, phase } = useGame()
  const awake = phase === 'daemon'
  const toNext = 60 - (minute % 60)
  const nextHour = Math.floor(minute / 60) + 1
  const lastCuckoo = nextHour * 60 >= DAY_END
  const [hh, mm] = formatTime(minute).split(':')
  return (
    <section className={`panel clock-panel${awake ? ' is-awake' : ''}`}>
      <div className="clock-top">
        <span className="eyebrow">Studio time</span>
        <span className="eyebrow">{DAYS[0]}</span>
      </div>
      <div className="digits" aria-label={`Studio time ${hh}:${mm}`}>
        {hh}
        <span className={awake ? 'colon frozen' : 'colon'}>:</span>
        {mm}
      </div>
      {awake ? (
        <div className="cuckoo-status awake">⏸ The daemon is awake</div>
      ) : (
        <div className="cuckoo-status">{lastCuckoo ? `Studio closes in ${toNext} min` : `Cuckoo in ${toNext} min`}</div>
      )}
      {/* one dot for every 5 minutes of the hour; they fill up until the cuckoo strikes */}
      <div className="hour-dots" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <i key={i} className={awake || i < Math.floor((60 - toNext) / 5) ? 'on' : ''} />
        ))}
      </div>
      <div className="small-print">
        1 sec = {STUDIO_MINUTES_PER_SECOND} studio min · {formatTime(DAY_START)}–{formatTime(DAY_END)}
      </div>
    </section>
  )
}

// A task's drawing, drawn line by line as your progress grows, with the pencil at the tip.
// The faint dashed lines show what is still to come; once it is finished, it turns the task's colour.
function TaskDrawing({ task, progress }) {
  const lengths = task.lines.map(([x0, y0, x1, y1]) => Math.hypot(x1 - x0, y1 - y0))
  let left = (progress / 100) * lengths.reduce((a, b) => a + b, 0)
  let tip = null
  const lines = task.lines.map(([x0, y0, x1, y1], i) => {
    const f = Math.min(1, Math.max(0, left / lengths[i]))
    left -= lengths[i]
    if (f <= 0) return null
    const x = x0 + (x1 - x0) * f
    const y = y0 + (y1 - y0) * f
    tip = [x, y] // the last line drawn so far holds the pencil
    return <line key={i} x1={x0} y1={y0} x2={x} y2={y} />
  })
  return (
    <svg className="plan" viewBox="0 0 160 110" aria-hidden="true">
      <g className="plan-guide">
        {task.lines.map(([x0, y0, x1, y1], i) => (
          <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} />
        ))}
      </g>
      <g className="plan-ink" style={progress >= 100 ? { stroke: task.colour } : undefined}>
        {lines}
      </g>
      {tip && progress < 100 && <circle className="plan-tip" cx={tip[0]} cy={tip[1]} r="5" />}
    </svg>
  )
}

// The day's three tasks, each with its drawing, the two tools it needs (red when the daemon has
// taken one) and how far along it is. The line at the bottom says what you can do right now.
export function TaskPanel() {
  const { progress, working, at, missing, phase } = useGame()
  const done = progress.split(',').map(Number)
  const lacking = missing ? missing.split(',') : []
  const total = Math.floor(done.reduce((a, b) => a + b, 0) / TASKS.length)

  const here = TASKS.find((t) => t.id === at)
  const possible = TASKS.filter((t, i) => done[i] < 100 && canDo(t, missing))
  let status = possible.length
    ? `Walk to a coloured ring to work: ${possible.map((t) => t.name.toLowerCase()).join(', ')}`
    : 'Nothing you can do without your tools. Wait for the next law…'
  if (here && done[TASKS.indexOf(here)] >= 100) status = `The ${here.name.toLowerCase()} is finished. Try another ring!`
  else if (here && !canDo(here, missing)) {
    const without = here.tools.filter((k) => lacking.includes(k)).map((k) => LABEL[k])
    status = `You can't do the ${here.name.toLowerCase()} without your ${without.join(' and ')}`
  }
  if (working) status = `✎ Working on the ${here.name.toLowerCase()}…`
  if (phase === 'daemon') status = 'Time stands still…'
  if (phase === 'done') status = 'All finished!'
  if (phase === 'closed') status = 'The studio is closed'

  return (
    <section className="panel task-panel">
      <div className="task-head">
        <span className="eyebrow">Today's tasks</span>
        <strong>{total}%</strong>
      </div>
      <ul className="tasks">
        {TASKS.map((t, i) => (
          <li key={t.id} className={`task${at === t.id ? ' is-here' : ''}${done[i] >= 100 ? ' is-done' : ''}`} style={{ '--task': t.colour }}>
            <TaskDrawing task={t} progress={done[i]} />
            <div className="task-info">
              <div className="task-name">
                <strong>{t.name}</strong>
                <span>{done[i] >= 100 ? '✓' : `${done[i]}%`}</span>
              </div>
              <small>at {t.place}</small>
              <div className="task-tools">
                {t.tools.map((k) => (
                  <span key={k} className={lacking.includes(k) ? 'tool-chip is-missing' : 'tool-chip'} title={LABEL[k]}>
                    {ICONS[k]}
                  </span>
                ))}
                <div className="meter">
                  <div className="meter-fill" style={{ width: `${done[i]}%` }} />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className={working ? 'task-status is-working' : 'task-status'}>{status}</p>
    </section>
  )
}

// Little drawings of the four things, for the tray.
const ICONS = {
  pencils: (
    <svg viewBox="0 0 32 32">
      <g strokeWidth="3" strokeLinecap="round">
        <line x1="13" y1="17" x2="10" y2="5" stroke={RED} />
        <line x1="16" y1="17" x2="16" y2="4" stroke={YELLOW} />
        <line x1="19" y1="17" x2="22" y2="6" stroke={MINT} />
      </g>
      <rect x="9" y="15" width="14" height="13" rx="4" fill={STEEL} />
    </svg>
  ),
  setsquare: (
    <svg viewBox="0 0 32 32">
      <path d="M6 27 H27 L6 6 Z" fill={YELLOW} strokeLinejoin="round" />
      <path d="M10.5 22.5 H17 L10.5 16 Z" fill={PAPER} />
    </svg>
  ),
  ruler: (
    <svg viewBox="0 0 32 32">
      <g transform="rotate(-35 16 16)">
        <rect x="2" y="12" width="28" height="8" rx="2" fill={PAPER} stroke={INK} strokeWidth="1.2" />
        <path d="M7 12 v3 M12 12 v4 M17 12 v3 M22 12 v4 M27 12 v3" stroke={INK} strokeWidth="1.2" />
        <rect x="25" y="16" width="5" height="4" rx="1" fill={RED} />
      </g>
    </svg>
  ),
  book: (
    <svg viewBox="0 0 32 32">
      <rect x="7" y="4" width="19" height="24" rx="3" fill={BLUE} />
      <rect x="10" y="4" width="2.5" height="24" fill={INK} opacity="0.25" />
      <rect x="15" y="9" width="7" height="2.5" rx="1.2" fill={PAPER} />
    </svg>
  ),
}

// The tray along the bottom: one card for each kind of thing you need. A card is bright when
// you own one right now, and faded and locked when the daemon's law gave it to someone else.
export function ToolTray() {
  useGame() // redraws whenever things change hands
  const cards = KINDS.map((k) => {
    const mine = game.belongings.filter((b) => b.kind === k.kind && b.owner === 'you')
    const brought = game.belongings.find((b) => b.kind === k.kind && b.origin === 'you')
    let note = `${NAME[brought.owner]} has it`
    if (mine.length > 1) note = `you have ${mine.length}!`
    else if (mine.length === 1) note = mine[0].origin === 'you' ? 'yours' : `was ${NAME[mine[0].origin]}'s`
    return { ...k, have: mine.length > 0, note }
  })
  return (
    <section className="panel tray" aria-label="Your things">
      <span className="eyebrow">Your things</span>
      <ul className="tray-cards">
        {cards.map((c) => (
          // the key changes with the note, so a card pops whenever it changes
          <li key={c.kind + c.note} className={c.have ? 'tray-card' : 'tray-card is-locked'}>
            <span className="tray-icon" aria-hidden="true">
              {ICONS[c.kind]}
              {!c.have && <span className="tray-lock">🔒</span>}
            </span>
            <strong>{c.label}</strong>
            <small>{c.note}</small>
          </li>
        ))}
      </ul>
    </section>
  )
}

// The daemon's speech bubble, hanging under the cuckoo close-up. It pops up as the daemon springs
// out of its door and stays there, so you can read the law in peace, until the next hour.
export function LawBubble() {
  const { line, minute, phase } = useGame()
  if (!line) return null
  const awake = phase === 'daemon'
  return (
    // a new key for every law, so the bubble pops up again each time
    <section key={line} className={`panel law-bubble${awake ? ' is-new' : ''}`} aria-live="polite">
      <span className="eyebrow">New law · {formatTime(Math.floor(minute / 60) * 60)}</span>
      <p>{line}</p>
    </section>
  )
}

// While the daemon is awake the room goes dim at the edges and a big CUCKOO! appears.
export function DaemonOverlay() {
  const { phase } = useGame()
  if (phase !== 'daemon') return null
  return (
    <div className="daemon-overlay" aria-live="polite">
      <div className="cuckoo-stamp">CUCKOO!</div>
      <div className="frozen-label">time stands still</div>
    </div>
  )
}

// A shower of confetti in the studio's colours, for when everything is done.
const CONFETTI_COLOURS = [RED, MINT, YELLOW, BLUE]
export function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => {
        const size = 6 + Math.random() * 7
        const dot = i % 3 === 0
        return {
          left: `${Math.random() * 100}%`,
          width: size,
          height: dot ? size : size * 0.45,
          background: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
          borderRadius: dot ? '50%' : 2,
          animationDelay: `${Math.random() * 3}s`,
          animationDuration: `${3 + Math.random() * 2.5}s`,
          '--drift': `${(Math.random() - 0.5) * 160}px`,
          '--spin': `${(Math.random() - 0.5) * 1080}deg`,
        }
      }),
    [],
  )
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((style, i) => (
        <i key={i} style={style} />
      ))}
    </div>
  )
}

export function EndPanel({ onRestart }) {
  const { phase, minute, progress } = useGame()
  if (phase !== 'done' && phase !== 'closed') return null
  const done = phase === 'done'
  const parts = progress.split(',').map(Number)
  const finished = TASKS.filter((t, i) => parts[i] >= 100).length
  const total = Math.floor(parts.reduce((a, b) => a + b, 0) / TASKS.length)
  return (
    <div className="end-backdrop">
      {done && <Confetti />}
      <section className="panel end-panel">
        <span className="eyebrow">{formatTime(minute)}</span>
        <h2>{done ? 'Hats off to your resilience!' : 'The studio closes.'}</h2>
        <p>
          {done
            ? `You finished all three drawings at ${formatTime(minute)}. Look at the cuckoo: even the daemon takes its hat off to you.`
            : `You finished ${finished} of 3 tasks (${total}% of the day's work). Tomorrow is another deadline.`}
        </p>
        <button className="button" onClick={onRestart}>
          Play the day again
        </button>
      </section>
    </div>
  )
}
