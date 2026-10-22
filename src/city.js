// Going Cuckoo: the city. A grid of spots floating in the sunset, with no streets: the houses
// stand side by side and the residents hop straight from roof to roof. The demon's clock tower
// stands in the middle. The spots right behind the tower stay empty, because the tower would hide
// them. Distances are in metres; x runs to the right, z towards the viewer, and the tower stands
// at 0, 0.
//
// The city grows during the day: it starts as 3 × 3 spots, and with every law after the first a
// new strip of land appears, on the right and the left in turn, up to 7 × 7 for the last hour.
// New neighbours arrive with the new land, each with their house.
//
// The residents are four kinds of shapes (cubes, spheres, cones and pyramids) in nine colours.
// You are the yellow one of the shape you pick. The houses always look the same: the demon can
// move them and hand them to someone else, but never change what they look like.

import { BLUE, LILAC, LIME, MINT, PINK, RED, TANGERINE, TEAL, TOWN_STONES, YELLOW } from './palette.js'
import { shuffle } from './town.js'

export const CELL = 3.9 // the distance from one spot to the next
export const GRID = 7 // spots along each side, once the city has fully grown
export const MID = 3 // the middle spot, where the tower stands
export const CITY_SIZE = CELL * GRID

// The land that is open at each stage of the day: its columns (c) and rows (r), from and to.
// A strip on the right is a new column at the front right and a new row at the back right; a
// strip on the left, a new column at the back left and a new row at the front left.
export const STAGES = [
  { c: [2, 4], r: [2, 4] }, // 3 × 3
  { c: [2, 5], r: [1, 4] }, // 4 × 4: a strip on the right
  { c: [1, 5], r: [1, 5] }, // 5 × 5: a strip on the left
  { c: [1, 6], r: [0, 5] }, // 6 × 6: on the right
  { c: [0, 6], r: [0, 6] }, // 7 × 7: on the left
]
// How many houses (and so residents) the city has at each stage. One spot is the grocery shop;
// of the rest, only about one spot in five is left for a tree.
export const HOUSES_AT = [5, 10, 17, 25, 36]

// The tower: its width and its height up to its clock head. It is the tallest thing in town.
export const TOWER = { w: 2.1, h: 11.5 }

// A spot's middle, in metres.
export const toWorld = (c, r) => ({ x: (c - MID) * CELL, z: (r - MID) * CELL })
export const inGrid = (c, r) => c >= 0 && r >= 0 && c < GRID && r < GRID
export const isTower = (c, r) => c === MID && r === MID
// the spots right behind the tower, which you couldn't see
export const isHidden = (c, r) => c === r && c < MID
// Whether a spot is part of the city yet, at this stage of the day.
export const isOpen = (stage, c, r) => {
  const s = STAGES[stage]
  return c >= s.c[0] && c <= s.c[1] && r >= s.r[0] && r <= s.r[1]
}
// The land at a stage, in metres: its middle (x, z) and its size along x and z (w, d).
export function areaOf(stage) {
  const s = STAGES[stage]
  const a = toWorld(s.c[0], s.r[0])
  const b = toWorld(s.c[1], s.r[1])
  return { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2, w: b.x - a.x + CELL, d: b.z - a.z + CELL }
}

// Every spot a house (or a tree) can stand on, once the city has fully grown: 45 of them.
export const PLOTS = []
for (let r = 0; r < GRID; r++) {
  for (let c = 0; c < GRID; c++) {
    if (isTower(c, r) || isHidden(c, r)) continue
    const { x, z } = toWorld(c, r)
    PLOTS.push({ c, r, x, z })
  }
}
export const plotAt = (c, r) => PLOTS.findIndex((p) => p.c === c && p.r === r)
// The spots of the city at a stage of the day, by number.
export const landOf = (stage) => PLOTS.map((_, i) => i).filter((i) => isOpen(stage, PLOTS[i].c, PLOTS[i].r))

// The four shapes you can be, and the colours the residents come in.
export const SHAPES = ['cube', 'sphere', 'cone', 'pyramid']
export const POINTY = ['cone', 'pyramid']
export const COLOURS = [
  { id: 'red', name: 'coral', hex: RED },
  { id: 'mint', name: 'green', hex: MINT },
  { id: 'lilac', name: 'lavender', hex: LILAC },
  { id: 'yellow', name: 'yellow', hex: YELLOW },
  { id: 'pink', name: 'pink', hex: PINK },
  { id: 'teal', name: 'teal', hex: TEAL },
  { id: 'orange', name: 'orange', hex: TANGERINE },
  { id: 'lime', name: 'lime', hex: LIME },
  { id: 'blue', name: 'blue', hex: BLUE },
]
export const COLOUR_BY_ID = Object.fromEntries(COLOURS.map((c) => [c.id, c]))

// Their names: the nine from the sphere town (town.js), and more in the same spirit.
const NAMES = [
  ...['Noor', 'Isa', 'Roy', 'Nari', 'Tuk', 'Meh', 'Sar', 'Sim', 'Simo', 'Lio', 'Ama', 'Pip', 'Oto', 'Bex', 'Rumi', 'Zaz'],
  ...['Kai', 'Lulu', 'Bo', 'Fen', 'Juno', 'Mio', 'Ted', 'Wim', 'Yas', 'Ola', 'Dax', 'Nell', 'Gus', 'Ivo', 'Pia', 'Rex', 'Suki', 'Tam', 'Vee', 'Ziggy'],
]

// Thirty-six residents: every shape in every colour, "yellow-cone" and so on, each with a name.
// (Whichever one you are, you are simply you.)
export const RESIDENTS = SHAPES.flatMap((shape) => COLOURS.map((colour) => ({ id: `${colour.id}-${shape}`, shape, colour: colour.id }))).map(
  (r, i) => ({ ...r, name: NAMES[i] }),
)
export const RESIDENT_BY_ID = Object.fromEntries(RESIDENTS.map((r) => [r.id, r]))
export const nameOf = (id) => RESIDENT_BY_ID[id].name

// The thirty-six houses, in the plain stone shapes of the old town (BuildingShape.jsx), fixed for
// good. Half are round (drums and domes), half are angular. flat: whether its top is flat (a box,
// as a cube would say). floors: how tall it is.
const round = (design, floors) => [design, 'round', floors, false]
const angular = (design, floors, flat = true) => [design, 'angular', floors, flat]
const DESIGNS = [
  ...[1, 1, 2, 2, 2, 3, 3, 4, 4].map((f) => round('drum', f)),
  ...[2, 2, 3, 3, 3, 4, 4, 2, 4].map((f) => round('dome', f)),
  ...[1, 1, 2, 3, 3].map((f) => angular('block', f)),
  ...[1, 2, 2, 3].map((f) => angular('tower', f)),
  ...[2, 3, 4].map((f) => angular('ziggurat', f)),
  ...[1, 2, 3].map((f) => angular('arch', f)),
  ...[2, 3, 4].map((f) => angular('pyramid', f, false)),
]

// The thirty-six houses, each owned by one resident. None of them is in town yet (plot: null): the
// game sets them down as their owners arrive, and the empty spots get trees.
export function createHouses() {
  const owners = shuffle(RESIDENTS.map((r) => r.id))
  return DESIGNS.map(([design, family, floors, flat], i) => ({
    id: i,
    design,
    family,
    floors,
    flat,
    stone: TOWN_STONES[i % TOWN_STONES.length],
    plot: null,
    owner: owners[i],
  }))
}
