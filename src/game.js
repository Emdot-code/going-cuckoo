// The rules of the day: the sped-up clock, the three tasks, everyone's belongings, and the
// daemon waking up every full hour. The 3D scene moves this forward every frame with tick(); the
// panels on the page read it with useGame().

import { useSyncExternalStore } from 'react'
import { createBelongings, missingKinds } from './belongings.js'
import { applyLaw, shuffledLaws, startingDesks } from './laws.js'
import { TASKS, TASK_BY_ID, TASK_MINUTES } from './tasks.js'

export const DAY_START = 9 * 60 // 09:00, in minutes since midnight
export const DAY_END = 18 * 60 // 18:00, the studio closes
export const STUDIO_MINUTES_PER_SECOND = 2 // one real second is two studio minutes, so an hour passes in 30 seconds
export const DAEMON_SECONDS = 7 // how long the daemon is awake, in real seconds; time stands still meanwhile

export const LAW_AT = 2.6 // seconds after waking when the daemon's new law takes effect and things start to float

// The live state, changed every frame.
export const game = {}
// What the panels see; only replaced when something visible changes.
let snapshot = {}
const listeners = new Set()

export function resetGame() {
  Object.assign(game, { minutes: DAY_START, working: false, at: null, phase: 'running', daemonT: 0, line: '' })
  game.progress = Object.fromEntries(TASKS.map((t) => [t.id, 0])) // % done of each task
  // at: the task whose spot you are standing at, or null
  game.belongings = createBelongings()
  game.desks = startingDesks() // who sits at which desk
  game.laws = shuffledLaws() // the day's laws, one for every hour
  game.law = null // the law in force; null until the daemon first wakes
  game.coming = null // the law the daemon is announcing, before it takes effect
  game.lawCount = 0 // how many laws have taken effect today
  game.missing = missingKinds(game.belongings).join()
  publish()
}

// A short text that changes whenever any belonging changes owner or desk, so the scene knows
// when to redraw them.
function ownersKey() {
  return game.belongings.map((b) => `${b.owner}@${b.desk}`).join()
}

// Each task's progress in whole percent, as '40,0,100'.
const progressKey = () => TASKS.map((t) => Math.floor(game.progress[t.id])).join()

// Whether you have both tools a task needs.
export const canDo = (task, missing) => task.tools.every((k) => !missing.split(',').includes(k))

function publish() {
  snapshot = {
    minute: Math.floor(game.minutes),
    progress: progressKey(),
    working: game.working,
    at: game.at,
    missing: game.missing, // the kinds of tools you have none of, as 'pencils,book'
    owners: ownersKey(), // changes whenever a belonging gets a new owner or moves
    phase: game.phase,
    line: game.line, // the newest law, as the daemon announced it; it stays up until the next one
  }
  listeners.forEach((fn) => fn())
}

function changed() {
  return (
    snapshot.minute !== Math.floor(game.minutes) ||
    snapshot.progress !== progressKey() ||
    snapshot.working !== game.working ||
    snapshot.at !== game.at ||
    snapshot.missing !== game.missing ||
    snapshot.owners !== ownersKey() ||
    snapshot.phase !== game.phase
  )
}

// The hour strikes: the daemon wakes up and announces the next law of the day.
function wakeDaemon() {
  game.phase = 'daemon'
  game.daemonT = 0
  game.coming = game.laws[game.lawCount % game.laws.length]
  game.line = game.coming.text
}

// Moves the day forward by dt real seconds. at: the task whose spot you are standing at, or null.
// You work on it while you have both its tools and it isn't finished yet.
export function tick(dt, at) {
  game.at = at
  if (game.phase === 'daemon') {
    game.daemonT += dt
    // the daemon forgets the old law and the new one takes effect: things float to their new owners
    if (game.coming && game.daemonT >= LAW_AT) {
      game.law = game.coming
      game.coming = null
      game.desks = applyLaw(game.law, game.belongings)
      game.lawCount++
      game.missing = missingKinds(game.belongings).join()
    }
    if (game.daemonT >= DAEMON_SECONDS) game.phase = 'running'
  } else if (game.phase === 'running') {
    const before = game.minutes
    game.minutes = Math.min(DAY_END, game.minutes + dt * STUDIO_MINUTES_PER_SECOND)
    game.missing = missingKinds(game.belongings).join()
    const task = TASK_BY_ID[at]
    game.working = !!task && game.progress[at] < 100 && canDo(task, game.missing)
    if (game.working) game.progress[at] = Math.min(100, game.progress[at] + (100 * dt * STUDIO_MINUTES_PER_SECOND) / TASK_MINUTES)

    if (TASKS.every((t) => game.progress[t.id] >= 100)) {
      game.phase = 'done'
      game.working = false
    } else if (game.minutes >= DAY_END) {
      game.phase = 'closed'
      game.working = false
    } else if (Math.floor(game.minutes / 60) > Math.floor(before / 60)) {
      wakeDaemon() // the hour strikes
    }
  }
  if (changed()) publish()
}

export function useGame() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    () => snapshot,
  )
}

// 545 → "09:05"
export function formatTime(minutes) {
  const h = Math.floor(minutes / 60)
  const m = Math.floor(minutes % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

resetGame()
