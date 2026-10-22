// The panels around the town: the town clock, the demon's rule of the hour, the residents (home,
// searching or asleep in the street), your goal (find your house before night falls), the "time
// stands still" effect while the demon is awake, and the night. They look like the studio's
// panels and share their styles.

import { STUDIO_MINUTES_PER_SECOND, formatTime } from './game.js'
import { Landscape } from './App.jsx'
import { Confetti } from './Hud.jsx'
import { DEMON, OWNER_BY_ID, RESIDENTS } from './town.js'
import { TOWN_END, TOWN_START, duskOf, isHome, sneeze, sphereOf, town, useTown } from './townGame.js'

// The sunset behind the town: the sun sinks behind the dunes from 17:00 and the sky turns to night.
export function TownSky() {
  const { minute } = useTown()
  return <Landscape dusk={duskOf(minute)} />
}

// The digital clock, with a countdown to the next time the demon wakes, or to nightfall.
export function TownClock() {
  const { minute, phase } = useTown()
  const awake = phase === 'daemon'
  const toNext = 60 - (minute % 60)
  const last = (Math.floor(minute / 60) + 1) * 60 >= TOWN_END
  const [hh, mm] = formatTime(minute).split(':')
  let status = `Demon wakes in ${toNext} min`
  if (last) status = `Night falls in ${toNext} min`
  if (phase === 'closed') status = 'Night. The demon sleeps.'
  return (
    <section className={`panel clock-panel${awake ? ' is-awake' : ''}`}>
      <div className="clock-top">
        <span className="eyebrow">Town time</span>
      </div>
      <div className="digits" aria-label={`Town time ${hh}:${mm}`}>
        {hh}
        <span className={awake ? 'colon frozen' : 'colon'}>:</span>
        {mm}
      </div>
      {awake ? <div className="cuckoo-status awake">⏸ The demon is awake</div> : <div className="cuckoo-status">{status}</div>}
      <div className="hour-dots" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <i key={i} className={awake || i < Math.floor((60 - toNext) / 5) ? 'on' : ''} />
        ))}
      </div>
      <div className="small-print">
        1 sec = {STUDIO_MINUTES_PER_SECOND} town min · {formatTime(TOWN_START)}–{formatTime(TOWN_END)}
      </div>
    </section>
  )
}

// The demon's speech bubble under the close-up of its clock. The old rule is already forgotten.
export function RuleBubble() {
  const { line, minute, phase } = useTown()
  if (!line) return null
  const awake = phase === 'daemon'
  return (
    <section key={line} className={`panel law-bubble${awake ? ' is-new' : ''}`} aria-live="polite">
      {/* (at night, the last rule is still the one from 17:00) */}
      <span className="eyebrow">Rule of the hour · {formatTime(Math.floor(Math.min(minute, TOWN_END - 1) / 60) * 60)}</span>
      <p>{line}</p>
      <small className="forgotten">The last rule? Forgotten. What it did stays.</small>
    </section>
  )
}

// Where a sphere is: home, bounced out, looking for its home, or asleep in the street.
function whereIs(s) {
  if (s.state === 'street') return { text: 'in the street' }
  if (s.state === 'hover' || (s.state === 'jump' && s.kind === 'throw')) return { text: 'bounced out!' }
  if (s.state === 'jump' && s.kind === 'bounce') return { text: 'boing!' }
  if (isHome(s)) return { text: town.phase === 'closed' ? 'asleep at home' : 'home' }
  return { text: 'looking for home' }
}

// One line per resident: their colour, name, where they are and how many houses they own. Their
// odd details (shoe size, forgotten dream) show when you point at them.
export function ResidentsPanel() {
  const { sneezer, phase } = useTown()
  const count = (id) => town.buildings.filter((b) => b.owner === id).length
  const demon = count('demon')
  return (
    <section className="panel residents">
      <div className="task-head">
        <span className="eyebrow">The spheres</span>
        <span className="eyebrow">homes</span>
      </div>
      <ul>
        {RESIDENTS.map((r) => {
          const where = whereIs(sphereOf(r.id))
          return (
            <li
              key={r.id}
              className={r.player ? 'resident is-you' : 'resident'}
              style={{ '--owner': r.colour }}
              title={`${r.skin} · shoe ${r.shoe} · forgot a dream about ${r.dream}`}
            >
              <i className="owner-dot" />
              <strong>
                {r.name} <small key={where.text}>{where.text}</small>
                {sneezer === r.id && <span className="achoo"> 🤧</span>}
              </strong>
              <b key={count(r.id)} className="count">
                {count(r.id)}
              </b>
            </li>
          )
        })}
        {demon > 0 && (
          <li className="resident" style={{ '--owner': DEMON.colour }} title="keeps them “for safekeeping”">
            <i className="owner-dot" />
            <strong>
              {DEMON.name} <small>no sphere, just houses</small>
            </strong>
            <b key={demon} className="count">
              {demon}
            </b>
          </li>
        )}
      </ul>
      <button className="button sneeze" onClick={() => sneeze('you')} disabled={phase !== 'running'}>
        🤧 Sneeze <kbd>space</kbd>
      </button>
    </section>
  )
}

// While the demon is awake, the town goes dim at the edges and a big CUCKOO! appears.
export function DemonOverlay() {
  const { phase } = useTown()
  if (phase !== 'daemon') return null
  return (
    <div className="daemon-overlay" aria-live="polite">
      <div className="cuckoo-stamp">CUCKOO!</div>
      <div className="frozen-label">time stands still</div>
    </div>
  )
}

// Your goal along the bottom: find your home before night falls.
export function GoalPanel() {
  const { phase } = useTown()
  const me = sphereOf('you')
  const houses = town.buildings.filter((b) => b.owner === 'you').length
  const homeCount = town.spheres.filter(isHome).length
  let status = 'Click a roof next door to hop onto it. If it isn’t your home, you’ll be bounced away.'
  if (isHome(me)) status = town.ruleCount === 0 ? 'You are home. Remember what it looks like: at 13:00 the demon moves every house.' : town.minutes >= TOWN_END - 60
      ? 'You are home. Stay put until night falls.'
      : 'You are home. Sit tight… until the demon strikes again.'
  else if (me.state === 'hover' || (me.state === 'jump' && me.kind === 'throw')) status = 'The houses moved! You’ve been bounced out.'
  else if (!houses) status = 'The demon’s rule left you without a home. Keep hopping… and hope the next rule gives you one.'
  if (phase === 'daemon') status = isHome(me) ? 'The demon is making a new rule. Hold on…' : 'The demon is making a new rule…'
  if (phase === 'closed') status = isHome(me) ? 'Night. You sleep at home.' : 'Night. You sleep in the street.'
  return (
    <section className={`panel goal${isHome(me) ? ' is-home' : ''}`}>
      <div className="task-head">
        <span className="eyebrow">⌂ Find your home before night falls</span>
        <span className="eyebrow">
          {homeCount} of {RESIDENTS.length} home
        </span>
      </div>
      <p className="goal-status">{status}</p>
    </section>
  )
}

// A dialogue box in the middle of the page, for a few seconds whenever something happens to you:
// "This is your home!", "Boing! Not your home." It gets a new key for every message, so it pops up
// again each time.
export function TownNote() {
  const { note } = useTown()
  if (!note.n || !note.text) return null
  const home = note.text.startsWith('⌂')
  return (
    <div key={note.n} className={`panel town-note${home ? ' is-home' : ''}`} role="status">
      {note.text}
    </div>
  )
}

// Night: you sleep at home, or in the street.
export function TownEnd({ onRestart }) {
  const { phase } = useTown()
  if (phase !== 'closed') return null
  const home = isHome(sphereOf('you'))
  const others = town.spheres.filter((s) => s.id !== 'you' && isHome(s)).length
  const house = OWNER_BY_ID[town.buildings[sphereOf('you').on].owner]
  return (
    <div className="end-backdrop is-night">
      {home && <Confetti />}
      <section className="panel end-panel">
        <span className="eyebrow">18:00 · night</span>
        <h2>{home ? 'Sleep tight, at home.' : 'You sleep in the street.'}</h2>
        <p>
          {home
            ? `You made it home before dark. ${others} of the other ${RESIDENTS.length - 1} spheres did too.`
            : `Night fell while you were on ${house.player ? 'a roof' : `${house.name}’s roof`}. ${others} of the other ${RESIDENTS.length - 1} spheres sleep at home tonight.`}{' '}
          The demon sleeps too, and tomorrow it will remember none of it.
        </p>
        <button className="button" onClick={onRestart}>
          Wake up to a new day
        </button>
      </section>
    </div>
  )
}
