// How people move: you with the keyboard, the colleagues wandering between their desk and
// random spots in the room. Nobody walks through furniture, walls or each other.

import { useEffect, useRef } from 'react'
import { DESK_BY_ID, OBSTACLES, PEOPLE, ROOM, seatOf } from './studio.js'
import { game } from './game.js'

export const BODY_RADIUS = 0.3
const PLAYER_SPEED = 2.8 // metres per second
const NPC_SPEED = 1.1

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

// Which keys walk in which direction on screen: [right, up].
const KEYS = {
  KeyW: [0, 1], ArrowUp: [0, 1],
  KeyS: [0, -1], ArrowDown: [0, -1],
  KeyA: [-1, 0], ArrowLeft: [-1, 0],
  KeyD: [1, 0], ArrowRight: [1, 0],
}

// Keeps track of which movement keys are held down.
export function useKeyboard() {
  const keys = useRef(new Set())
  useEffect(() => {
    const down = (e) => {
      if (!(e.code in KEYS)) return
      keys.current.add(e.code)
      e.preventDefault()
    }
    const up = (e) => keys.current.delete(e.code)
    const clear = () => keys.current.clear()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
    }
  }, [])
  return keys
}

// Pushes a person standing at p out of any furniture and keeps them inside the room.
export function resolve(p, r = BODY_RADIUS) {
  for (const o of OBSTACLES) {
    const x0 = o.x - o.w / 2, x1 = o.x + o.w / 2
    const z0 = o.z - o.d / 2, z1 = o.z + o.d / 2
    const cx = clamp(p.x, x0, x1)
    const cz = clamp(p.z, z0, z1)
    const dx = p.x - cx
    const dz = p.z - cz
    const d2 = dx * dx + dz * dz
    if (d2 >= r * r) continue
    if (d2 > 1e-8) {
      const d = Math.sqrt(d2)
      p.x = cx + (dx / d) * r
      p.z = cz + (dz / d) * r
    } else {
      // standing inside the box: step out the shortest way
      const out = [[p.x - x0, x0 - r, 'x'], [x1 - p.x, x1 + r, 'x'], [p.z - z0, z0 - r, 'z'], [z1 - p.z, z1 + r, 'z']]
      const [, to, axis] = out.reduce((a, b) => (b[0] < a[0] ? b : a))
      p[axis] = to
    }
  }
  p.x = clamp(p.x, -ROOM.w / 2 + r, ROOM.w / 2 - r)
  p.z = clamp(p.z, -ROOM.d / 2 + r, ROOM.d / 2 - r)
}

function randomSpot() {
  const p = { x: (Math.random() - 0.5) * (ROOM.w - 1), z: (Math.random() - 0.5) * (ROOM.d - 1) }
  resolve(p)
  return p
}

// Everyone starts at their own desk.
export function createBodies() {
  return PEOPLE.map((person) => {
    const seat = seatOf(DESK_BY_ID[person.desk])
    return {
      id: person.id,
      player: !!person.player,
      x: seat.x,
      z: seat.z,
      facing: Math.PI, // looking at the desk
      moving: false,
      target: null,
      wait: 1 + Math.random() * 4,
      stuck: 0,
      goHome: false,
    }
  })
}

// Moves everyone forward by dt seconds.
export function stepWorld(bodies, keys, dt) {
  for (const b of bodies) {
    const before = { x: b.x, z: b.z }
    if (b.player) movePlayer(b, keys, dt)
    else moveColleague(b, dt)
    if (b.moving) {
      const dx = b.x - before.x
      const dz = b.z - before.z
      if (dx * dx + dz * dz > 1e-8) b.facing = Math.atan2(dx, dz)
    }
  }
  separate(bodies)
}

function movePlayer(b, keys, dt) {
  let right = 0
  let up = 0
  for (const code of keys.current) {
    right += KEYS[code][0]
    up += KEYS[code][1]
  }
  // the camera looks at the room from the front right corner, so "up" on screen
  // means towards the back left of the room
  let dx = (right - up) / Math.SQRT2
  let dz = (-right - up) / Math.SQRT2
  const len = Math.hypot(dx, dz)
  b.moving = len > 0
  if (!b.moving) return
  b.x += (dx / len) * PLAYER_SPEED * dt
  b.z += (dz / len) * PLAYER_SPEED * dt
  resolve(b)
}

// After a new law, every colleague soon sets off to see the desk that is theirs now.
export function headToDesks(bodies) {
  for (const b of bodies) {
    if (b.player) continue
    b.wait = 0.2 + Math.random() * 1.5
    b.goHome = false // flips to true when the wait is over
  }
}

// A colleague waits a little, then walks somewhere: every other trip back to their desk.
function moveColleague(b, dt) {
  if (b.wait > 0) {
    b.wait -= dt
    b.moving = false
    if (b.wait <= 0) {
      b.goHome = !b.goHome
      b.target = b.goHome ? seatOf(DESK_BY_ID[game.desks[b.id]]) : randomSpot()
      b.stuck = 0
    }
    return
  }
  const dx = b.target.x - b.x
  const dz = b.target.z - b.z
  const dist = Math.hypot(dx, dz)
  if (dist < 0.15) {
    b.wait = 2 + Math.random() * 5
    if (b.goHome) b.facing = Math.PI
    b.moving = false
    return
  }
  const step = Math.min(dist, NPC_SPEED * dt)
  const before = { x: b.x, z: b.z }
  b.x += (dx / dist) * step
  b.z += (dz / dist) * step
  resolve(b)
  b.moving = true
  // blocked by a desk or a person for a while: give up and pick somewhere else
  const moved = Math.hypot(b.x - before.x, b.z - before.z)
  b.stuck = moved < step * 0.3 ? b.stuck + dt : 0
  if (b.stuck > 1) {
    b.goHome = false
    b.target = randomSpot()
    b.stuck = 0
  }
}

// People who bump into each other step apart.
function separate(bodies) {
  const min = BODY_RADIUS * 2
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i]
      const b = bodies[j]
      const dx = b.x - a.x
      const dz = b.z - a.z
      const d = Math.hypot(dx, dz)
      if (d >= min || d < 1e-6) continue
      const push = (min - d) / 2
      a.x -= (dx / d) * push
      a.z -= (dz / d) * push
      b.x += (dx / d) * push
      b.z += (dz / d) * push
      resolve(a)
      resolve(b)
    }
  }
}
