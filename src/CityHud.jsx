// Everything on the page around the 3D city, kept as small as possible: the start screen where you
// pick your character, a little bar with the five hours, the notes that pop up when something
// happens to you, the key hint, the tower's display and the demon's speech bubble (pinned to the
// tower, see anchors.js), the z z z at night, and the sunset at the end of the day.

import { useEffect, useRef, useState } from 'react'
import { Landscape } from './App.jsx'
import { Confetti } from './Hud.jsx'
import { PLOTS, SHAPES } from './city.js'
import { HOURS, city, clockOf, duskOf, isHome, me, sunOf, useCity } from './cityGame.js'
import { TOWER_SPOTS, TREE_TOP, carryPoint, houseTop, shopSign } from './CityScene.jsx'
import { LIST_LENGTH } from './groceries.js'
import { anchorRef, toScreen } from './anchors.js'
import { INK, MINT, RED, YELLOW } from './palette.js'
import { isMuted, setMuted } from './sounds.js'

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

// A little bar along the top: a dot for each of the five hours, and what to do next.
export function HourBar() {
  const { phase, lawCount, home, carrying, delivered } = useCity()
  if (phase === 'select') return null
  let status = 'go to the shop 🛒'
  if (carrying !== null) status = `take the ${city.list[carrying].name} home`
  else if (delivered === LIST_LENGTH) status = home ? 'all done · home!' : 'all done · go home'
  else if (lawCount === 0 && home && delivered === 0) status = 'remember your house · then shop'
  if (phase === 'night') status = 'sunset'
  return (
    <div className={`panel hour-bar${home ? ' is-home' : ''}`}>
      <span className="hour-dots" aria-label={`Hour ${lawCount} of ${HOURS}`}>
        {Array.from({ length: HOURS }, (_, i) => (
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

// The digital display on the front of the tower: just the time and a dot for each of the five
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
          {Array.from({ length: HOURS }, (_, i) => (
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
// Your grocery list, in the top left corner: what's home already, what you carry, what's left.
export function GroceryList() {
  const { phase, carrying } = useCity()
  if (phase === 'select') return null
  return (
    <div className="panel grocery-list">
      <span className="eyebrow">Grocery list</span>
      <ul>
        {city.list.map((g, i) => (
          <li key={g.name} className={g.done ? 'is-done' : i === carrying ? 'is-carried' : ''}>
            <span className="icon">{g.icon}</span>
            <span className="name">{g.name}</span>
            <span className="state">{g.done ? '✓' : i === carrying ? 'in hand' : ''}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// What you carry, floating above your head; and the shop's sign above its roof.
export function Carried() {
  const { phase, carrying } = useCity()
  if (phase !== 'running' || carrying === null) return null
  return (
    <div className="pin" ref={anchorRef(carryPoint)} aria-hidden="true">
      <div key={carrying} className="carried">
        {city.list[carrying].icon}
      </div>
    </div>
  )
}
export function ShopSign() {
  const { phase } = useCity()
  if (phase === 'select') return null
  return (
    <div className="pin" ref={anchorRef(shopSign)} aria-hidden="true">
      <div className="shop-sign">🛒 shop</div>
    </div>
  )
}

// A round button in the top right corner that turns all the sounds off and on again (so does M).
export function MuteButton() {
  const { phase } = useCity()
  const [muted, setMutedState] = useState(isMuted)
  const toggle = () => {
    setMuted(!isMuted())
    setMutedState(isMuted())
  }
  useEffect(() => {
    const down = (e) => e.code === 'KeyM' && toggle()
    window.addEventListener('keydown', down)
    return () => window.removeEventListener('keydown', down)
  }, [])
  if (phase === 'select') return null
  return (
    <button className="panel mute-button" onClick={toggle} aria-label={muted ? 'Sound on' : 'Sound off'} title={muted ? 'Sound on (M)' : 'Sound off (M)'}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" className="speaker" />
        {muted ? <path d="M15.5 9.5l5 5M20.5 9.5l-5 5" className="off" /> : <path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11" className="waves" />}
      </svg>
    </button>
  )
}

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
          Law {lawCount} of {HOURS} · {clockOf(Math.floor(city.minutes / 60) * 60)}
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

// Sunset: a purple card in the middle. Home or stranded, which groceries made it home, and the
// demon itself, delivering its verdict.
export function CityEnd({ onAgain }) {
  const { phase } = useCity()
  if (phase !== 'night') return null
  const { home, delivered } = city
  return (
    <div className="city-end">
      {home && delivered === LIST_LENGTH && <Confetti />}
      <section className="end-card">
        <span className="eyebrow">18:00 · the sun has set</span>
        <h2>{home ? 'You made it home!' : 'Stranded at sunset.'}</h2>
        <div className="end-groceries" aria-label={`${delivered} of ${LIST_LENGTH} groceries home`}>
          {city.list.map((g) => (
            <span key={g.name} className={g.done ? 'is-done' : ''}>
              {g.icon}
            </span>
          ))}
        </div>
        <p className="end-count">
          {delivered} of {LIST_LENGTH} groceries home
        </p>
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
