// The studio: its size, the furniture and the six people who work in it.
// Distances are in metres. x runs to the right along the back wall, z towards the viewer;
// the centre of the room is at 0, 0. The window wall is on the left (x = -6.5).
// The room is small, square and tall, so in the isometric view it reads as a cube and the
// camera can come close: the six big desks fill most of it.

import { RED, YELLOW } from './palette.js'

export const ROOM = { w: 13, d: 13, wallH: 4.8, wallT: 0.45, sill: 0.45, head: 3.8, slab: 0.5 }

// All furniture is drawn this many times bigger than real, so it reads clearly in the
// isometric view. The sizes below are the real sizes; positions are already in the room.
export const FURNITURE_SCALE = 1.3
const S = FURNITURE_SCALE

// Three tall windows in the left wall: their centre along the wall and their width.
export const WINDOWS = [
  { z: -4.0, w: 2.2 },
  { z: -0.4, w: 2.2 },
  { z: 3.2, w: 2.2 },
]

// The direction the sunlight travels in: from the upper left, slightly from the back.
export const SUN_DIR = [1, -0.9, 0.35]

// Six big desks in two columns and three rows, filling most of the room. Each person stands
// at the chair in front of (south of) their desk. The desks are drawn only a little bigger
// than real, smaller than the rest of the furniture, so there is room to walk between them.
export const DESK_SCALE = 1.05
export const DESK_SIZE = { w: 3.6, d: 1.9, h: 0.75 }
export const DESKS = [
  { id: 'desk-1', x: -1.92, z: -4.5 },
  { id: 'desk-2', x: 3.66, z: -4.5 },
  { id: 'desk-3', x: -1.92, z: -0.3 },
  { id: 'desk-4', x: 3.66, z: -0.3 },
  { id: 'desk-5', x: -1.92, z: 3.9 },
  { id: 'desk-6', x: 3.66, z: 3.9 },
]
export const seatOf = (desk) => ({ x: desk.x, z: desk.z + (DESK_SIZE.d / 2 + 0.35) * DESK_SCALE })

// A big drafting table in the sunlight by the back window. The board is 1 m across, 1.45 m long.
export const DRAFTING_TABLES = [{ id: 'drafting-1', x: -5.6, z: -4.0, w: 1, d: 1.45 }]

export const SHELF = { x: -3.5, z: -6.15, w: 4.2, d: 0.5, h: 2.3 }

// A small reading corner by the front window: two armchairs turned towards each other, with
// a round rug and a little side table between them.
export const READING_CORNER = { x: -5.95, z: 4.0 }
// rot turns the chair: 0 faces the viewer, π/2 faces right
export const ARMCHAIRS = [
  { x: -5.75, z: 3.0, rot: Math.PI / 2 - 0.4, color: RED },
  { x: -5.75, z: 5.0, rot: Math.PI / 2 + 0.4, color: YELLOW },
]

export const PLANTS = [
  { x: -6.0, z: -2.2, kind: 'bush', s: 0.9 },
  { x: -6.0, z: 1.4, kind: 'tall', s: 1 },
  { x: -5.95, z: 6.0, kind: 'tall', s: 1.1 },
  { x: 0.15, z: -6.1, kind: 'snake', s: 1 },
  { x: 6.0, z: -6.1, kind: 'tall', s: 1.0 },
  { x: 6.0, z: 6.0, kind: 'bush', s: 0.9 },
]

// Pictures on the walls: on the back wall by x, on the left wall by z.
export const FRAMES = [
  { wall: 'back', x: 4.2, y: 2.7, w: 1.0, h: 1.35, art: 'plan' },
  { wall: 'back', x: 5.6, y: 3.1, w: 0.9, h: 0.9, art: 'circle' },
  { wall: 'back', x: 5.6, y: 1.9, w: 0.9, h: 0.65, art: 'squares' },
  { wall: 'left', z: 5.5, y: 2.6, w: 1.4, h: 1.8, art: 'triangle' },
  { wall: 'left', z: -5.8, y: 2.9, w: 0.7, h: 0.95, art: 'section' },
]

// The cuckoo clock hangs high on the back wall, where the daemon lives. It is drawn this many times bigger than a real one.
export const CLOCK = { x: 2.0, y: 3.0, scale: 2.6 }

// Everything nobody can walk through. Furniture takes up its drawn (scaled-up) size.
const box = ({ x, z, w, d }) => ({ x, z, w: w * S, d: d * S })
export const OBSTACLES = [
  ...DESKS.map(({ x, z }) => ({ x, z, w: DESK_SIZE.w * DESK_SCALE, d: DESK_SIZE.d * DESK_SCALE })),
  ...DRAFTING_TABLES.map(box),
  box(SHELF),
  ...ARMCHAIRS.map(({ x, z }) => box({ x, z, w: 0.85, d: 0.85 })),
  box({ ...READING_CORNER, w: 0.5, d: 0.5 }), // the side table
  ...PLANTS.map(({ x, z, s }) => box({ x, z, w: 0.5 * s, d: 0.5 * s })),
  { x: CLOCK.x, z: -ROOM.d / 2 + 0.3, w: 0.7, d: 0.6 }, // the pendulum
]

// The people. Their hair, height, age, shoe size and arrival time are what the daemon will
// later build its absurd laws of ownership on.
export const PEOPLE = [
  { id: 'you', name: 'You', hair: '#3b2a20', height: 1.68, age: 24, shoe: 39, arrival: '09:10', desk: 'desk-6', player: true },
  { id: 'noor', name: 'Noor', hair: '#151515', height: 1.74, age: 26, shoe: 40, arrival: '07:45', desk: 'desk-1' },
  { id: 'isa', name: 'Isa', hair: '#c0632e', height: 1.62, age: 21, shoe: 44, arrival: '10:30', desk: 'desk-2' },
  { id: 'roy', name: 'Roy', hair: '#d9b44a', height: 1.9, age: 29, shoe: 46, arrival: '08:20', desk: 'desk-3' },
  { id: 'nari', name: 'Nari', hair: '#6b4428', height: 1.56, age: 23, shoe: 37, arrival: '06:55', desk: 'desk-4' },
  { id: 'tuk', name: 'Tuk', hair: '#d8d8d8', height: 1.8, age: 31, shoe: 42, arrival: '09:55', desk: 'desk-5' },
]

export const DESK_BY_ID = Object.fromEntries(DESKS.map((d) => [d.id, d]))
