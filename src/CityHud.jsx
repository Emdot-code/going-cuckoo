// Everything on the page around the 3D city, kept as small as possible: the start screen where you
// pick your character, a little bar with the six hours, the notes that pop up when something
// happens to you, the key hint, the tower's display and the demon's speech bubble (pinned to the
// tower, see anchors.js), the z z z at night, and the sunset at the end of the day.

import { useEffect, useRef } from 'react'
import { Landscape } from './App.jsx'
import { Confetti } from './Hud.jsx'
import { PLOTS, SHAPES } from './city.js'
import { city, clockOf, duskOf, isHome, me, sunOf, useCity } from './cityGame.js'
import { TOWER_SPOTS, TREE_TOP, houseTop } from './CityScene.jsx'
import { anchorRef, toScreen } from './anchors.js'
import { INK, MINT, RED, YELLOW } from './palette.js'

// The sunset behind the city: the sun sinks and the sky darkens a little every hour, until night
// falls at 18:00.
export function CitySky() {
  const { minute, phase } = useCity()
  return <Landscape sun={sunOf(minute)} dusk={phase === 'night' ? 1 : duskOf(minute)} />
}

// The four shapes, drawn flat in yellow, as you'd draw them in isometric.
export function ShapeIcon({ shape }) {
  return (
    <svg viewBox="0 0 60 60" className="shape-icon" aria-hidden="true">
      {shape === 'cube' && (
        <>
          <path d="M30 8 L50 19 L30 30 L10 19 Z" className="light" />
          <path d="M10 19 L30 30 L30 52 L10 41 Z" className="mid" />
          <path d="M50 19 L30 30 L30 52 L50 41 Z" className="dark" />
        </>
      )}
      {shape === 'sphere' && (
        <>
          <circle cx="30" cy="31" r="21" className="mid" />
          <circle cx="23" cy="24" r="8" className="light" />
        </>
      )}
      {shape === 'cone' && (
        <>
          <ellipse cx="30" cy="47" rx="17" ry="6" className="dark" />
          <path d="M30 6 L47 47 A17 6 0 0 1 13 47 Z" className="mid" />
          <path d="M30 6 L13 47 A17 6 0 0 0 26 52.5 Z" className="light" />
        </>
      )}
      {shape === 'pyramid' && (
        <>
          <path d="M30 7 L8 42 L30 53 Z" className="light" />
          <path d="M30 7 L52 42 L30 53 Z" className="dark" />
        </>
      )}
    </svg>
  )
}

// The start screen: the title and the four characters to choose from, just the shapes. It covers
// the city. onPick gets the shape and where its picture is, so it can fly into the city.
export function StartScreen({ onPick }) {
  const { phase } = useCity()
  if (phase !== 'select') return null
  return (
    <div className="start-screen">
      <h1>Going Cuckoo…</h1>
      <p className="subtitle">Select your character</p>
      <div className="shape-picks">
        {SHAPES.map((shape) => (
          <button key={shape} className="shape-pick" aria-label={shape} onClick={(e) => onPick(shape, e.currentTarget.getBoundingClientRect())}>
            <ShapeIcon shape={shape} />
          </button>
        ))}
      </div>
    </div>
  )
}

const FLIGHT_MS = 1400

// Right after you pick: the start screen fades away while the shape you picked flies down, in a
// little arc, shrinking, and lands on your roof in the city.
export function IntroFlight({ intro, onDone }) {
  const { shape, from } = intro
  const icon = useRef()
  const veil = useRef()
  const done = useRef(onDone)
  done.current = onDone
  useEffect(() => {
    let waiting = 0
    let settled = 0
    let raf
    const fly = () => {
      // wait until the city is drawn and its camera is in place (the very first time, the
      // browser can take a second or two to get the 3D ready), then a few frames more
      const w = me()
      const house = city.houses[w.house]
      const p = PLOTS[house.plot]
      const to = toScreen([p.x, houseTop(house) + 0.5, p.z])
      if ((!to && waiting++ < 600) || (to && settled++ < 4)) {
        raf = requestAnimationFrame(fly)
        return
      }
      const dx = (to ? to.x : from.x + from.width / 2) - (from.x + from.width / 2)
      const dy = (to ? to.y : from.y + from.height / 2) - (from.y + from.height / 2)
      const end = 52 / from.width // about the size of your shape in the city
      const at = (x, y, s) => `translate(${x}px, ${y}px) scale(${s})`
      icon.current.animate(
        [
          { transform: at(0, 0, 1) },
          { transform: at(dx * 0.45, dy * 0.45 - 90, (1 + end) / 2), offset: 0.45 },
          { transform: at(dx, dy, end), opacity: 1, offset: 0.85 },
          { transform: at(dx, dy, end), opacity: 0 },
        ],
        { duration: FLIGHT_MS, easing: 'ease-in-out', fill: 'forwards' },
      ).onfinish = () => done.current()
      veil.current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FLIGHT_MS * 0.8, delay: 150, easing: 'ease-in', fill: 'forwards' })
    }
    raf = requestAnimationFrame(fly)
    return () => cancelAnimationFrame(raf)
  }, [from])
  return (
    <div className="intro-flight" aria-hidden="true">
      <div ref={veil} className="intro-veil" />
      <div ref={icon} className="intro-icon" style={{ left: from.x, top: from.y, width: from.width, height: from.height }}>
        <ShapeIcon shape={shape} />
      </div>
    </div>
  )
}

// A little bar along the top: a dot for each of the six hours, and whether you are working or
// searching.
export function HourBar() {
  const { phase, lawCount, home } = useCity()
  if (phase === 'select') return null
  let status = home ? 'working' : 'searching for home'
  if (lawCount === 0 && home) status = 'working · remember your house'
  if (phase === 'night') status = 'sunset'
  return (
    <div className={`panel hour-bar${home ? ' is-home' : ''}`}>
      <span className="hour-dots" aria-label={`Hour ${lawCount} of 6`}>
        {Array.from({ length: 6 }, (_, i) => (
          <i key={i} className={i < lawCount ? 'on' : ''} />
        ))}
      </span>
      <span>{status}</span>
    </div>
  )
}

// A short note at the bottom, for a moment, whenever something happens to you. It gets a new key
// for every note, so it pops up again each time.
export function CityNote() {
  const { note, phase } = useCity()
  if (!note.n || !note.text || phase === 'select' || phase === 'night') return null
  return (
    <div key={note.n} className={`panel town-note city-note${note.mood === 'home' ? ' is-home' : ''}`} role="status">
      {note.text}
    </div>
  )
}

// The digital display on the front of the tower: just the time and a dot for each of the six
// hours (and CUCKOO! while the demon talks). It is slanted to lie flat on the wall.
export function TowerDisplay() {
  const { minute, phase, lawCount, inscribed } = useCity()
  let text = ''
  if (!inscribed) text = 'CUCKOO!'
  if (phase === 'night') text = 'Zzz…'
  return (
    <div className="pin" ref={anchorRef(TOWER_SPOTS.display)}>
      <div className={`tower-display${inscribed ? '' : ' is-awake'}`}>
        <b>{clockOf(minute)}</b>
        <span className="display-dots">
          {Array.from({ length: 6 }, (_, i) => (
            <i key={i} className={i < lawCount ? 'on' : ''} />
          ))}
        </span>
        {text && <small>{text}</small>}
      </div>
    </div>
  )
}

// The law of the hour, carved into the stone of the tower's other wall, like an inscription on a
// monument. A new one is cut in letter by letter once the demon has finished talking; the old one
// is gone. Before the first law, the wall is blank.
export function LawInscription() {
  const { lawCount, inscribed, phase } = useCity()
  const law = inscribed ? city.law : city.laws[lawCount - 2] // (the old law stays until the new one is cut)
  if (!law || phase === 'select') return null
  const fresh = inscribed && phase !== 'night'
  // each letter is cut on its own, but they are kept together in words, so lines only break
  // between words
  let n = 0
  return (
    <div className="pin" ref={anchorRef(TOWER_SPOTS.inscription)}>
      <p key={law.id} className={`inscription${fresh ? ' is-fresh' : ''}`} aria-label={law.title}>
        {law.title.split(' ').map((word, w) => (
          <span key={w} className="word" aria-hidden="true">
            {[...word].map((letter, i) => (
              <span key={i} style={{ animationDelay: `${n++ * 60}ms` }}>
                {letter}
              </span>
            ))}{' '}
          </span>
        ))}
      </p>
    </div>
  )
}

// The birds shout at you from their tree when you land on it.
export function BirdShout() {
  const { shout, phase } = useCity()
  if (!shout.n || phase !== 'running') return null
  const p = PLOTS[shout.plot]
  return (
    <div className="pin" ref={anchorRef([p.x, TREE_TOP + 1.4, p.z])}>
      <div key={shout.n} className="bird-shout" role="status">
        {shout.text}
      </div>
    </div>
  )
}

// A north arrow in the corner. The grid runs diagonally across the screen, so north (where the up
// arrow or W takes you) points up and to the right.
export function NorthArrow() {
  const { phase } = useCity()
  if (phase === 'select') return null
  return (
    <div className="north-arrow" aria-label="North is up and to the right: the up arrow or W takes you north">
      <svg viewBox="0 0 80 80" aria-hidden="true">
        <circle cx="40" cy="40" r="30" className="dial" />
        {/* a quarter turn of the screen's up, minus the 30° slant of the isometric grid */}
        <g transform="rotate(60 40 40)">
          <path d="M40 14 L47 42 L40 37 L33 42 Z" className="needle" />
          <path d="M40 66 L47 42 L40 47 L33 42 Z" className="tail" />
          <text x="40" y="9" textAnchor="middle" className="n">
            N
          </text>
        </g>
      </svg>
      <span>
        <kbd>↑</kbd> north
      </span>
    </div>
  )
}

// The demon's speech bubble, next to its head for a few seconds after every law. The law is
// already in force: nobody has to wait for it to finish. Then the bubble shrinks and flies into
// the tower's stone wall, where the law is carved.
export function DemonBubble() {
  const { bubble, lawCount } = useCity()
  if (!bubble || !city.speech) return null
  const { opener, text, closer } = city.speech
  // how far it is from the bubble to the stone wall where the law is carved, on screen
  const a = toScreen(TOWER_SPOTS.bubble)
  const b = toScreen(TOWER_SPOTS.inscription)
  const flight = a && b ? { '--fly-x': `${b.x - a.x}px`, '--fly-y': `${b.y - a.y}px` } : {}
  return (
    <div className="pin" ref={anchorRef(TOWER_SPOTS.bubble)}>
      <div className={`demon-bubble${bubble === 'leaving' ? ' is-leaving' : ''}`} style={flight}>
        <span className="eyebrow">
          Law {lawCount} of 6 · {clockOf(Math.floor(city.minutes / 60) * 60)}
        </span>
        <em>{opener}</em>
        <p>{text}</p>
        <em>{closer}</em>
      </div>
    </div>
  )
}

// Floating z z z letters over a sleeper, or the sleeping demon.
function Zzz({ point }) {
  return (
    <div className="pin" ref={anchorRef(point)} aria-hidden="true">
      <div className="zzz">
        <span>z</span>
        <span>z</span>
        <span>Z</span>
      </div>
    </div>
  )
}

// At night: z z z over everyone asleep on their own roof, and over the demon.
export function Sleepers() {
  const { phase } = useCity()
  if (phase !== 'night') return null
  return (
    <>
      {city.walkers.filter(isHome).map((w) => {
        const house = city.houses[w.house]
        const p = PLOTS[house.plot]
        return <Zzz key={w.id} point={[p.x, houseTop(house) + 1.8, p.z]} />
      })}
      <Zzz point={TOWER_SPOTS.sleep} />
    </>
  )
}

// The demon, drawn flat for the sunset card: a round plum head with red horns, yellow eyes and
// its mint nightcap, half asleep already.
function DemonPortrait() {
  return (
    <svg viewBox="0 0 120 110" className="demon-portrait" aria-hidden="true">
      <path d="M30 38 L22 8 L44 30 Z" fill={RED} />
      <path d="M90 38 L98 8 L76 30 Z" fill={RED} />
      <circle cx="60" cy="62" r="40" fill={INK} />
      <path d="M38 34 Q62 -4 96 14 Q78 22 82 34 Z" fill={MINT} />
      <circle cx="98" cy="13" r="7" fill={YELLOW} />
      <ellipse cx="45" cy="58" rx="8" ry="5" fill={YELLOW} />
      <ellipse cx="75" cy="58" rx="8" ry="5" fill={YELLOW} />
      <path d="M48 78 Q60 88 72 78" stroke={RED} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M22 80 L8 70" stroke={INK} strokeWidth="6" strokeLinecap="round" />
      <path d="M98 80 L112 66" stroke={INK} strokeWidth="6" strokeLinecap="round" />
    </svg>
  )
}

// "3 h 20 min"
const hours = (minutes) => {
  const m = Math.round(minutes)
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`
}

// Sunset: a purple card in the middle. Home or stranded, how long you worked and searched, and
// the demon itself, delivering its verdict.
export function CityEnd({ onAgain }) {
  const { phase } = useCity()
  if (phase !== 'night') return null
  const { home, work, search } = city
  const share = (work / Math.max(1, work + search)) * 100
  return (
    <div className="city-end">
      {home && <Confetti />}
      <section className="end-card">
        <span className="eyebrow">18:00 · the sun has set</span>
        <h2>{home ? 'You made it home!' : 'Stranded at sunset.'}</h2>
        <div className="work-bar" aria-hidden="true">
          <i style={{ width: `${share}%` }} />
        </div>
        <div className="work-times">
          <span className="work">worked {hours(work)}</span>
          <span className="search">searched {hours(search)}</span>
        </div>
        <div className="demon-says">
          <DemonPortrait />
          <blockquote>“{city.verdict}”</blockquote>
        </div>
        <button className="button" onClick={onAgain}>
          Play again
        </button>
      </section>
    </div>
  )
}
