// The town: a square of 5 × 5 plots floating in the sunset, with the demon's clock tower on the
// middle plot. Distances are in metres; x runs to the right, z towards the viewer, and the
// tower stands at 0, 0.
//
// The residents are spheres. Their colour, shoe size and the dream they forgot are what the
// demon builds its rules on. Their buildings are listed in createBuildings().

import { BLUE, CINNAMON, INK, LILAC, LIME, MINT, PINK, RED, TANGERINE, TEAL, TOWN_STONES, YELLOW } from './palette.js'

export const PLOT = 3 // the width of one plot
export const GRID = 5 // plots along each side
export const TOWN_SIZE = PLOT * GRID

// The tower in the middle: its width, its height up to the roof, and how big its cuckoo clock is.
export const TOWER = { w: 2.4, h: 10, clockY: 7.6, clockScale: 3 }

// Every plot a building can stand on: all of the grid except the middle one, which is the tower's.
export const PLOTS = []
for (let row = 0; row < GRID; row++) {
  for (let col = 0; col < GRID; col++) {
    const x = (col - 2) * PLOT
    const z = (row - 2) * PLOT
    if (x === 0 && z === 0) continue
    PLOTS.push({ x, z, fromTower: Math.hypot(x, z) })
  }
}

// One floor of a building, in metres.
export const FLOOR = 0.9

// The shapes a building can take, and what to call them.
export const SHAPES = ['block', 'tower', 'drum', 'arch', 'pyramid', 'dome', 'ziggurat']
export const SHAPE_NAME = {
  block: 'Block',
  tower: 'Slim tower',
  drum: 'Drum',
  arch: 'Arch',
  pyramid: 'Pyramid',
  dome: 'Dome',
  ziggurat: 'Ziggurat',
}

// How tall a building is, from its base to its very top.
export function topOf(shape, floors) {
  const h = floors * FLOOR
  if (shape === 'tower') return h * 1.4
  if (shape === 'dome') return Math.max(0.15, h - 0.9) + 0.95
  return h
}

// The people of the town are spheres, and their colour is their skin: it is also the dot above
// every building they own. skin is what the demon calls that colour; warm says whether the demon
// thinks of it as a warm colour or a cool one.
// The dreams are ones they have forgotten; only the demon still remembers them.
export const RESIDENTS = [
  { id: 'you', name: 'You', colour: YELLOW, skin: 'sunny yellow', warm: true, shoe: 39, dream: 'a staircase that only goes down', player: true },
  { id: 'noor', name: 'Noor', colour: RED, skin: 'coral red', warm: true, shoe: 40, dream: 'a cat made of windows' },
  { id: 'isa', name: 'Isa', colour: MINT, skin: 'mint green', warm: false, shoe: 44, dream: 'swimming through a library at noon' },
  { id: 'roy', name: 'Roy', colour: BLUE, skin: 'cornflower blue', warm: false, shoe: 46, dream: 'teeth' },
  { id: 'nari', name: 'Nari', colour: LILAC, skin: 'lilac', warm: false, shoe: 37, dream: 'a door that was also a sandwich and also a grandmother' },
  { id: 'tuk', name: 'Tuk', colour: PINK, skin: 'rose pink', warm: true, shoe: 42, dream: 'the number nine, but sad' },
  { id: 'meh', name: 'Meh', colour: TANGERINE, skin: 'tangerine', warm: true, shoe: 38, dream: 'a bathtub full of tiny chairs' },
  { id: 'sar', name: 'Sar', colour: TEAL, skin: 'teal', warm: false, shoe: 43, dream: 'being the landlord of the moon' },
  { id: 'sim', name: 'Sim', colour: LIME, skin: 'lime', warm: false, shoe: 41, dream: 'a library where every book was the same book' },
  { id: 'simo', name: 'Simo', colour: CINNAMON, skin: 'cinnamon', warm: true, shoe: 45, dream: 'stairs that kept apologising' },
]

// The demon can own buildings too, when a rule says so. It has a few details of its own.
export const DEMON = { id: 'demon', name: 'The demon', colour: INK, skin: 'plum', warm: false, shoe: 2, dream: 'being a clock' }

export const OWNERS = [...RESIDENTS, DEMON]
export const OWNER_BY_ID = Object.fromEntries(OWNERS.map((o) => [o.id, o]))

// Who sneezed when, before the day began (a higher number is more recent): Tuk sneezed last.
export const START_SNEEZES = { roy: 1, sim: 2, nari: 3, you: 4, meh: 5, isa: 6, simo: 7, noor: 8, sar: 9, tuk: 10 }

// The same things in a random order.
export const shuffle = (list) => {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Twenty buildings on random plots (so four plots stay empty): one home for each resident, and
// ten more that belong to the demon.
// plot: which of PLOTS it stands on. rot: how far it is turned. lift: how high it floats.
// flip: whether it hangs upside down. was: who owned it before the last rule.
export function createBuildings() {
  const plots = shuffle(PLOTS.map((_, i) => i))
  return Array.from({ length: RESIDENTS.length * 2 }, (_, i) => {
    const owner = RESIDENTS[i]?.id ?? 'demon'
    return {
      id: i,
      plot: plots[i],
      shape: SHAPES[i % SHAPES.length],
      floors: 1 + Math.floor(Math.random() * 4),
      rot: 0,
      lift: 0,
      flip: false,
      owner,
      was: owner,
      stone: TOWN_STONES[i % TOWN_STONES.length],
    }
  })
}
