// The city's day: a short working start at 11:45, then six hours from 12:00 to 18:00. Every full
// hour the demon pops out of the tower and announces a law, which takes effect at once: the
// houses get new owners and move about, and everyone is suddenly on a roof that isn't theirs.
// The others know where to go; you have to work it out. At 18:00 the sun sets, the demon sleeps
// and every house locks.
//
// The 3D city moves this forward every frame with tickCity(); the panels read it with useCity().
//
// Everyone in town always stands on top of something: a house (house: its id), or a tree on an
// empty spot (tree: the spot's number). They hop from one to the next, over `dur` seconds, with
// t going from 0 to 1. On a roof that isn't theirs they keep bouncing; on their own, they rest.
// When a house moves, whoever stands on it rides along.

import { useSyncExternalStore } from 'react'
import { GRID, PLOTS, RESIDENTS, createHouses, inGrid, isHidden, isTower, plotAt } from './city.js'
import { announce, lawsOfTheDay, note, ownerNote, verdict } from './cityLaws.js'
import { shuffle } from './town.js'

export const DAY_START = 11 * 60 + 45 // 11:45: a little work before the first law
export const FIRST_LAW = 12 * 60
export const SUNSET = 18 * 60
export const MINUTES_PER_SECOND = 1.5 // one city hour lasts 40 real seconds
export const TALK_SECONDS = 9 // how long the demon stays out, talking
// when its speech bubble flies into the tower's display, and the law is written on the wall
export const INSCRIBE_AT = TALK_SECONDS - 1.6

const HOP = 0.42 // seconds for one of your hops
// The others take their time, so you can't simply follow them home: a long moment of
// confusion after every law, a pause before every hop, and now and then a wrong turn.
const NPC_HOP = 0.6
const NPC_CONFUSED = [3, 9] // seconds, after a law (at least, at most)
const NPC_PAUSE = [1.2, 3] // seconds, between hops
const NPC_WRONG_TURN = 0.35 // the chance that a hop goes somewhere random
const between = ([lo, hi]) => lo + Math.random() * (hi - lo)
const BUMP = 0.3 // a hop towards the tower or the edge, which goes nowhere

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]

// The live state, changed every frame.
export const city = {}
// What the panels see; only replaced when something visible changes.
let snapshot = {}
const listeners = new Set()

export const homeOf = (id) => city.houses.find((h) => h.owner === id)
export const walkerOf = (id) => city.walkers.find((w) => w.id === id)
export const me = () => walkerOf(city.player)
// The spot a walker stands on (or is hopping to).
export const spotOf = (w) => (w.house !== null ? city.houses[w.house].plot : w.tree)
// Home: standing still on your own roof.
export const isHome = (w) => w.t >= 1 && w.house !== null && city.houses[w.house].owner === w.id

// shape: the shape you picked. Without one, the city just waits behind the start screen.
export function resetCity(shape = null) {
  Object.assign(city, {
    phase: shape ? 'running' : 'select', // 'select', 'running' or 'night'
    minutes: DAY_START,
    lawCount: 0, // how many laws have been announced
    law: null, // the law in force
    speech: null, // what the demon said
    demonT: 99, // seconds since the demon popped out
    work: 0, // city minutes you spent at home, working
    search: 0, // city minutes you spent looking for it
    home: false, // whether you made it home by sunset
    verdict: '',
    note: { text: '', n: 0 },
    birds: {}, // how often the birds on each tree have been disturbed
    shout: { plot: null, text: '', n: 0 }, // the birds' latest shout at you
  })
  city.shape = shape ?? 'cube'
  city.player = `yellow-${city.shape}`
  city.houses = createHouses()
  city.laws = lawsOfTheDay()
  // everyone starts the day at home, on their own roof
  city.walkers = RESIDENTS.map((r) => ({ id: r.id, house: homeOf(r.id).id, tree: null, t: 1, dur: HOP, hops: 0, bumps: 0, bump: null, path: [], wait: 0, queued: null }))
  if (shape) startCity(shape)
  publish()
}

// You pick your shape on the start screen: the day begins in the city that was already waiting
// behind it, so nothing has to be built again.
export function startCity(shape) {
  city.shape = shape
  city.player = `yellow-${shape}`
  city.phase = 'running'
  say('You’re at work. Remember your house!')
  publish()
}

// mood: 'home' for the happy news, which shows in green
function say(text, mood = '') {
  city.note = { text, mood, n: city.note.n + 1 }
}

// Hops onto whatever stands on spot p: a house, or a tree.
function hop(w, p, dur) {
  const house = city.houses.find((h) => h.plot === p)
  w.house = house ? house.id : null
  w.tree = house ? null : p
  w.t = 0
  w.dur = dur
  w.hops++
}

// You press an arrow key (or W, A, S, D): a hop to the next spot along the grid.
export function press(dc, dr) {
  if (city.phase !== 'running') return
  const w = me()
  if (w.t < 1) {
    w.queued = { dc, dr } // remember it, and hop as soon as this hop is done
    return
  }
  const { c, r } = PLOTS[spotOf(w)]
  const to = { c: c + dc, r: r + dr }
  if (!inGrid(to.c, to.r) || isHidden(to.c, to.r) || isTower(to.c, to.r)) {
    // a little hop towards it, and back
    w.bump = { dc, dr }
    w.bumps++
    w.t = 0
    w.dur = BUMP
    return say(note(isTower(to.c, to.r) ? 'tower' : 'edge'))
  }
  hop(w, plotAt(to.c, to.r), HOP)
}

// A hop is done. On a tree, the birds get mad; on someone else's roof, you find out whose it is.
function land(w) {
  const bumped = w.bump
  w.bump = null
  if (bumped) return
  const you = w.id === city.player
  if (w.tree !== null) {
    city.birds[w.tree] = (city.birds[w.tree] ?? 0) + 1
    if (you) city.shout = { plot: w.tree, text: note('birds'), n: city.shout.n + 1 }
  } else if (isHome(w)) {
    w.path = []
    if (you) say(note('home'), 'home')
  } else if (you) say(ownerNote(city.houses[w.house].owner))
}

const pick = (list) => list[Math.floor(Math.random() * list.length)]
// The spots next door to spot p.
const neighbours = (p) =>
  DIRS.map(([dc, dr]) => ({ c: PLOTS[p].c + dc, r: PLOTS[p].r + dr }))
    .filter(({ c, r }) => inGrid(c, r) && !isTower(c, r) && !isHidden(c, r))
    .map(({ c, r }) => plotAt(c, r))

// The shortest way home, hopping from spot to spot, as a list of spots; the last one is home.
function route(w) {
  const goal = PLOTS[homeOf(w.id).plot]
  const start = PLOTS[spotOf(w)]
  const key = (c, r) => r * GRID + c
  const came = new Map([[key(start.c, start.r), null]])
  const queue = [start]
  while (queue.length) {
    const cur = queue.shift()
    if (cur.c === goal.c && cur.r === goal.r) {
      const path = []
      for (let k = key(cur.c, cur.r); came.get(k) !== null; k = came.get(k)) path.unshift(plotAt(k % GRID, Math.floor(k / GRID)))
      return path
    }
    for (const [dc, dr] of shuffle(DIRS)) {
      const c = cur.c + dc
      const r = cur.r + dr
      if (!inGrid(c, r) || isTower(c, r) || isHidden(c, r) || came.has(key(c, r))) continue
      came.set(key(c, r), key(cur.c, cur.r))
      queue.push({ c, r })
    }
  }
  return []
}

// Moves everyone along: hops land, your next hop starts, and the others hop home.
function moveWalkers(dt) {
  for (const w of city.walkers) {
    if (w.t < 1) {
      w.t = Math.min(1, w.t + dt / w.dur)
      if (w.t === 1) land(w)
      continue
    }
    if (w.id === city.player) {
      if (w.queued) {
        const { dc, dr } = w.queued
        w.queued = null
        press(dc, dr)
      }
      continue
    }
    if (isHome(w) || city.phase !== 'running') continue
    w.wait -= dt
    if (w.wait > 0) continue
    if (!w.path.length) w.path = route(w)
    let next = w.path.shift()
    if (next !== undefined && Math.random() < NPC_WRONG_TURN) {
      // a wrong turn: somewhere next door instead, and then the way home from there
      next = pick(neighbours(spotOf(w)))
      w.path = []
    }
    if (next === undefined) w.wait = 1
    else {
      hop(w, next, NPC_HOP)
      w.wait = between(NPC_PAUSE)
    }
  }
}

// The hour strikes: the demon pops out and announces a law, which takes effect at once. Nobody
// is home any more, and the others set off for their new houses after a moment of confusion.
function strike() {
  city.demonT = 0
  city.law = city.laws[city.lawCount]
  city.speech = announce(city.law)
  city.law.apply(city)
  city.lawCount++
  for (const w of city.walkers) {
    w.queued = null
    w.path = []
    w.wait = between(NPC_CONFUSED)
    // anyone on a tree where a house has just landed is now standing on that house
    if (w.tree !== null) {
      const house = city.houses.find((h) => h.plot === w.tree)
      if (house) {
        w.house = house.id
        w.tree = null
      }
    }
  }
  say(note('evicted'))
}

// 18:00: the sun sets, the demon sleeps and every house locks.
function sunset() {
  city.phase = 'night'
  const w = me()
  if (w.t < 1) {
    w.t = 1 // made it just in time (or not)
    land(w)
  }
  city.home = isHome(w)
  city.verdict = verdict(city.home, city.work / Math.max(1, city.work + city.search))
}

// Moves the day forward by dt real seconds.
export function tickCity(dt) {
  city.demonT += dt
  if (city.phase === 'running') {
    const before = city.minutes
    city.minutes = Math.min(SUNSET, city.minutes + dt * MINUTES_PER_SECOND)
    if (isHome(me())) city.work += city.minutes - before
    else city.search += city.minutes - before
    if (city.minutes >= SUNSET) sunset()
    else if (Math.floor(city.minutes / 60) > Math.floor(before / 60)) strike()
  }
  if (city.phase !== 'select') moveWalkers(dt)
  if (changed()) publish()
}

// How far the sun has sunk: 0 at noon, 1 at sunset. And how dark the sky is: it darkens a little
// every hour, more and more towards the end.
export const sunOf = (minutes) => Math.min(1, Math.max(0, (minutes - FIRST_LAW) / (SUNSET - FIRST_LAW)))
export const duskOf = (minutes) => sunOf(minutes) ** 1.6 * 0.85

const view = () => ({
  minute: Math.floor(city.minutes),
  phase: city.phase,
  lawCount: city.lawCount,
  // the speech bubble: 'up' while the demon talks, then 'leaving' as it flies into the display
  bubble: city.phase !== 'running' || city.lawCount === 0 || city.demonT < 0.9 || city.demonT > INSCRIBE_AT + 0.8 ? null : city.demonT < INSCRIBE_AT ? 'up' : 'leaving',
  shout: city.shout,
  inscribed: city.lawCount === 0 || city.phase === 'night' || city.demonT >= INSCRIBE_AT + 0.6, // the law is on the wall
  home: isHome(me()),
  note: city.note,
})

function publish() {
  snapshot = view()
  listeners.forEach((fn) => fn())
}

function changed() {
  const now = view()
  return Object.keys(now).some((k) => now[k] !== snapshot[k])
}

export function useCity() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    () => snapshot,
  )
}

// "13:05"
export const clockOf = (minutes) => {
  const m = Math.floor(minutes)
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

resetCity()

// While developing: when this file (or the laws or the city it uses) changes, reload the whole page.
// Swapping the new code in under a running game would leave two copies of the game, with the
// keys talking to one and the city on screen showing the other, so the keys would seem dead.
if (import.meta.hot) import.meta.hot.accept(() => window.location.reload())
