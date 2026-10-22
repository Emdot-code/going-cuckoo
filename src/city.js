// Going Cuckoo: the city. A grid of 5 × 5 spots floating in the sunset, with no streets: the
// houses stand side by side and the residents hop straight from roof to roof. The demon's clock
// tower stands on the middle spot. The two spots behind the tower stay empty, because the tower
// would hide them. Distances are in metres; x runs to the right, z towards the viewer, and the
// tower stands at 0, 0.
//
// The residents are four kinds of shapes (cubes, spheres, cones and pyramids) in four colours.
// You are the yellow one of the shape you pick. The houses always look the same: the demon can
// move them and hand them to someone else, but never change what they look like.

import { LILAC, MINT, RED, TOWN_STONES, YELLOW } from './palette.js'
import { shuffle } from './town.js'

export const CELL = 3.9 // the distance from one spot to the next
export const GRID = 5 // spots along each side
export const MID = 2 // the middle spot, where the tower stands
export const CITY_SIZE = CELL * GRID

// The tower: its width and its height up to its clock head. It is the tallest thing in town.
export const TOWER = { w: 2.1, h: 11.5 }

// A spot's middle, in metres.
export const toWorld = (c, r) => ({ x: (c - MID) * CELL, z: (r - MID) * CELL })
export const inGrid = (c, r) => c >= 0 && r >= 0 && c < GRID && r < GRID
export const isTower = (c, r) => c === MID && r === MID
// the spots right behind the tower, which you couldn't see
export const isHidden = (c, r) => c === r && c < MID

// Every spot a house (or a tree) can stand on: 22 of them.
export const PLOTS = []
for (let r = 0; r < GRID; r++) {
  for (let c = 0; c < GRID; c++) {
    if (isTower(c, r) || isHidden(c, r)) continue
    const { x, z } = toWorld(c, r)
    PLOTS.push({ c, r, x, z })
  }
}
export const plotAt = (c, r) => PLOTS.findIndex((p) => p.c === c && p.r === r)

// The four shapes you can be, and the colours the residents come in.
export const SHAPES = ['cube', 'sphere', 'cone', 'pyramid']
export const POINTY = ['cone', 'pyramid']
export const COLOURS = [
  { id: 'red', name: 'coral', hex: RED },
  { id: 'mint', name: 'green', hex: MINT },
  { id: 'lilac', name: 'lavender', hex: LILAC },
  { id: 'yellow', name: 'yellow', hex: YELLOW },
]
export const COLOUR_BY_ID = Object.fromEntries(COLOURS.map((c) => [c.id, c]))

// Their names: the nine from the sphere town (town.js), and seven more in the same spirit.
const NAMES = ['Noor', 'Isa', 'Roy', 'Nari', 'Tuk', 'Meh', 'Sar', 'Sim', 'Simo', 'Lio', 'Ama', 'Pip', 'Oto', 'Bex', 'Rumi', 'Zaz']

// Sixteen residents: every shape in every colour, "yellow-cone" and so on, each with a name.
// (Whichever one you are, you are simply you.)
export const RESIDENTS = SHAPES.flatMap((shape) => COLOURS.map((colour) => ({ id: `${colour.id}-${shape}`, shape, colour: colour.id }))).map(
  (r, i) => ({ ...r, name: NAMES[i] }),
)
export const RESIDENT_BY_ID = Object.fromEntries(RESIDENTS.map((r) => [r.id, r]))
export const nameOf = (id) => RESIDENT_BY_ID[id].name

// The sixteen houses, in the plain stone shapes of the old town (BuildingShape.jsx), fixed for
// good. Half are round (drums and domes), half are angular. flat: whether its top is flat (a box,
// as a cube would say). floors: how tall it is.
const DESIGNS = [
  ['drum', 'round', 1, false],
  ['drum', 'round', 2, false],
  ['drum', 'round', 3, false],
  ['drum', 'round', 4, false],
  ['dome', 'round', 2, false],
  ['dome', 'round', 3, false],
  ['dome', 'round', 4, false],
  ['dome', 'round', 3, false],
  ['block', 'angular', 1, true],
  ['block', 'angular', 3, true],
  ['tower', 'angular', 2, true],
  ['tower', 'angular', 3, true],
  ['ziggurat', 'angular', 2, true],
  ['ziggurat', 'angular', 4, true],
  ['arch', 'angular', 2, true],
  ['pyramid', 'angular', 3, false],
]

// The houses on 16 random spots (the other 6 get a tree), each owned by one resident.
export function createHouses() {
  const plots = shuffle(PLOTS.map((_, i) => i))
  const owners = shuffle(RESIDENTS.map((r) => r.id))
  return DESIGNS.map(([design, family, floors, flat], i) => ({
    id: i,
    design,
    family,
    floors,
    flat,
    stone: TOWN_STONES[i % TOWN_STONES.length],
    plot: plots[i],
    owner: owners[i],
  }))
}
