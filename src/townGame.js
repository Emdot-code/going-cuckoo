// The town's day: six sped-up hours from 12:00 to 18:00, the demon waking every full hour with a
// new rule, people sneezing now and then, and the residents, who are spheres, trying to find their
// home before night falls at 18:00. The 3D town moves this forward every frame with tickTown();
// the panels on the page read it with useTown().
//
// Every sphere starts the day at home, sitting on its roof. When the demon strikes, it makes its
// rule and then moves all the houses to new plots, right under the spheres, so that every sphere
// is suddenly sitting on someone else's house; and so they are all bounced up and out, and land
// somewhere in town. Nothing on a house says whose it is. A sphere only finds out by hopping onto
// a roof next door: if it's not its home, it is bounced away again, onto some roof nearby; if it
// is, it stays. You are the yellow sphere, and you hop by clicking a roof next door. At night the
// demon sleeps, and whoever is not home sleeps in the street.

import { useSyncExternalStore } from 'react'
import { DAEMON_SECONDS, LAW_AT, STUDIO_MINUTES_PER_SECOND } from './game.js'
import { PLOT, PLOTS, RESIDENTS, START_SNEEZES, createBuildings, shuffle } from './town.js'
import { RULES } from './rules.js'

export const TOWN_START = 12 * 60 // 12:00, in minutes since midnight
export const TOWN_END = 18 * 60 // 18:00: night
export const DUSK_START = 17 * 60 // the sun starts to set in the last hour

const HOP_SECONDS = 0.55 // one hop to the roof next door
const BOUNCE_SECONDS = 0.7 // being bounced away from a roof that isn't your home
const THROW_SECONDS = 1.6 // being thrown out when the demon strikes
const HOVER_SECONDS = 1.2 // how long the spheres hang in the air while the houses move under them

// The live state, changed every frame.
export const town = {}
// What the panels see; only replaced when something visible changes.
let snapshot = {}
const listeners = new Set()

export function resetTown() {
  Object.assign(town, { minutes: TOWN_START, phase: 'running', daemonT: 0, line: '', coming: null, ruleCount: 0, thrown: true })
  town.buildings = createBuildings()
  town.rules = shuffle(RULES) // the day's rules, one for every hour
  town.sneezedAt = { ...START_SNEEZES }
  town.sneezes = Object.keys(START_SNEEZES).length // counts every sneeze, so the newest has the highest number
  town.nextSneeze = 6 + Math.random() * 10 // real seconds until someone else sneezes
  town.note = { text: '', n: 0 } // the newest message for you ("This is your home!"), and a counter
  // Every sphere starts at home.
  // on: the building it sits on (or is flying to). state: 'sit', 'jump', 'hover' or 'street'.
  // kind: what sort of jump: 'hop', 'bounce' or 'throw'. jumps counts its jumps.
  // tried: the roofs it has found are not its home since the houses last moved.
  town.spheres = RESIDENTS.map((r) => {
    const on = town.buildings.findIndex((b) => b.owner === r.id)
    return { id: r.id, on, state: 'sit', kind: 'hop', t: 0, dur: 0, wait: 0, jumps: 0, tried: new Set() }
  })
  publish()
}

// Whether a sphere is home: sitting on a house it owns.
export const isHome = (s) => s.state === 'sit' && town.buildings[s.on].owner === s.id
export const sphereOf = (id) => town.spheres.find((s) => s.id === id)
const pick = (list) => list[Math.floor(Math.random() * list.length)]

// The buildings next door to building i: on the plots around it, diagonals included.
const nextDoor = (i, j) => {
  const a = PLOTS[town.buildings[i].plot]
  const b = PLOTS[town.buildings[j].plot]
  return i !== j && Math.max(Math.abs(a.x - b.x), Math.abs(a.z - b.z)) <= PLOT
}
export const neighbours = (i) => town.buildings.map((_, j) => j).filter((j) => nextDoor(i, j))

// Whether you can hop onto building i right now: time runs, you are sitting on a roof that isn't
// your home (once home, you stay put), and building i is next door.
export const canHopTo = (i) => {
  const me = sphereOf('you')
  return town.phase === 'running' && me.state === 'sit' && !isHome(me) && nextDoor(me.on, i)
}

function say(text) {
  town.note = { text, n: town.note.n + 1 }
}

function jump(s, to, kind) {
  s.on = to
  s.state = 'jump'
  s.kind = kind
  s.t = 0
  s.dur = { hop: HOP_SECONDS, bounce: BOUNCE_SECONDS, throw: THROW_SECONDS }[kind]
  s.jumps++
}

// You click a roof next door: you hop onto it.
export function hopTo(i) {
  if (!canHopTo(i)) return
  jump(sphereOf('you'), i, 'hop')
  publish()
}

// A sphere lands. On its home it stays. Anywhere else: if it hopped there on purpose, the house
// bounces it away onto some roof nearby; if it was thrown or bounced there, it stays to catch its
// breath, and then tries again.
function land(s) {
  const you = s.id === 'you'
  if (town.buildings[s.on].owner === s.id) {
    s.state = 'sit'
    if (you) say('⌂ This is your home!')
    return
  }
  s.tried.add(s.on)
  const nearby = neighbours(s.on)
  if (s.kind === 'hop' && nearby.length) {
    jump(s, pick(nearby), 'bounce')
    if (you) say('Boing! Not your home.')
  } else {
    s.state = 'sit'
    s.wait = 0.4 + Math.random() * 0.6
  }
}

// Where one of the other spheres hops next: a roof next door it hasn't tried yet, if there is one.
function nextHop(s) {
  const nearby = neighbours(s.on)
  const untried = nearby.filter((i) => !s.tried.has(i))
  return untried.length ? pick(untried) : nearby.length ? pick(nearby) : null
}

// The demon moves every house to a new plot, but the spheres stay where they are, up in the air:
// each of them ends up above a house that is not its own (or above nothing at all).
function moveHouses() {
  const spots = new Map() // plot → the spheres above it
  for (const s of town.spheres) {
    if (s.state === 'street') continue
    s.plot = town.buildings[s.on].plot
    spots.set(s.plot, [...(spots.get(s.plot) ?? []), s.id])
  }
  const order = shuffle(town.buildings.map((_, i) => i))
  const placed = new Set()
  for (const [plot, ids] of spots) {
    const i = order.find((j) => !placed.has(j) && !ids.includes(town.buildings[j].owner))
    town.buildings[i].plot = plot
    placed.add(i)
  }
  const rest = shuffle(PLOTS.map((_, p) => p).filter((p) => !spots.has(p)))
  for (const i of order) if (!placed.has(i)) town.buildings[i].plot = rest.pop()
  for (const s of town.spheres) {
    if (s.state === 'street') continue
    s.on = town.buildings.findIndex((b) => b.plot === s.plot)
    s.state = 'hover'
    s.tried.clear() // the houses have moved: everything has to be tried again
  }
}

// After hanging in the air for a moment, every sphere is bounced up and out, and lands on some
// building in town that is not its home.
function throwEveryoneOut() {
  for (const s of town.spheres) {
    if (s.state !== 'hover') continue
    const others = town.buildings.map((_, i) => i).filter((i) => i !== s.on && town.buildings[i].owner !== s.id)
    jump(s, pick(others), 'throw')
  }
  say('The houses moved! You’ve been bounced out.')
}

// Moves the spheres along: flights land, and the others decide where to hop next.
function moveSpheres(dt) {
  for (const s of town.spheres) {
    if (s.state === 'jump') {
      s.t += dt
      if (s.t >= s.dur) land(s)
    } else if (s.state === 'sit' && !isHome(s) && s.id !== 'you' && town.phase === 'running') {
      s.wait -= dt
      if (s.wait <= 0) {
        const to = nextHop(s)
        if (to === null) s.wait = 1
        else jump(s, to, 'hop')
      }
    }
  }
}

// Night falls: the demon stays asleep, and whoever isn't home sleeps in the street.
function nightFalls() {
  town.phase = 'closed'
  for (const s of town.spheres) if (!isHome(s)) s.state = 'street'
}

// A short text that changes whenever anything about any building or sphere changes.
const buildingsKey = () => town.buildings.map((b) => `${b.owner}${b.plot}${b.shape}${b.floors}${b.lift}${b.flip}${b.rot}`).join()
const spheresKey = () => town.spheres.map((s) => `${s.state}${s.kind}${s.on}${isHome(s)}`).join()
const sneezerKey = () => RESIDENTS.reduce((a, r) => (town.sneezedAt[r.id] > town.sneezedAt[a] ? r.id : a), 'you')

function publish() {
  snapshot = {
    minute: Math.floor(town.minutes),
    phase: town.phase,
    line: town.line, // the newest rule, as the demon announced it; it stays up until the next one
    buildings: buildingsKey(),
    spheres: spheresKey(),
    sneezer: sneezerKey(), // who sneezed last
    note: town.note,
  }
  listeners.forEach((fn) => fn())
}

function changed() {
  return (
    snapshot.minute !== Math.floor(town.minutes) ||
    snapshot.phase !== town.phase ||
    snapshot.buildings !== buildingsKey() ||
    snapshot.spheres !== spheresKey() ||
    snapshot.sneezer !== sneezerKey() ||
    snapshot.note !== town.note
  )
}

// Someone sneezes. The demon notices.
export function sneeze(id) {
  if (town.phase !== 'running') return
  town.sneezedAt[id] = ++town.sneezes
  publish()
}

// The hour strikes: the demon wakes up, forgets the last rule and announces a new one.
function wakeDemon() {
  town.phase = 'daemon'
  town.daemonT = 0
  town.thrown = false
  town.coming = town.rules[town.ruleCount % town.rules.length]
  town.line = town.coming.text(town)
}

// Moves the day forward by dt real seconds.
export function tickTown(dt) {
  if (town.phase === 'daemon') {
    town.daemonT += dt
    // the new rule takes effect, and the demon moves all the houses under the spheres
    if (town.coming && town.daemonT >= LAW_AT) {
      town.coming.apply(town)
      town.coming = null
      town.ruleCount++
      moveHouses()
    }
    // a moment later, everyone is bounced out
    if (!town.thrown && town.daemonT >= LAW_AT + HOVER_SECONDS) {
      town.thrown = true
      throwEveryoneOut()
    }
    if (town.daemonT >= DAEMON_SECONDS) town.phase = 'running'
  } else if (town.phase === 'running') {
    const before = town.minutes
    town.minutes = Math.min(TOWN_END, town.minutes + dt * STUDIO_MINUTES_PER_SECOND)
    // now and then one of the others sneezes
    town.nextSneeze -= dt
    if (town.nextSneeze <= 0) {
      const others = RESIDENTS.filter((r) => !r.player)
      sneeze(pick(others).id)
      town.nextSneeze = 10 + Math.random() * 20
    }
    if (town.minutes >= TOWN_END) nightFalls()
    else if (Math.floor(town.minutes / 60) > Math.floor(before / 60)) wakeDemon() // the hour strikes
  }
  if (town.phase !== 'closed') moveSpheres(dt)
  if (changed()) publish()
}

// How far the sun has set: 0 all day, rising to 1 as night falls in the last hour.
export const duskOf = (minutes) => Math.min(1, Math.max(0, (minutes - DUSK_START) / (TOWN_END - DUSK_START)))

export function useTown() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    () => snapshot,
  )
}

resetTown()
