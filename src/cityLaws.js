// The cuckoo demon's laws, and everything else it says. Every hour it pops out of the tower and
// announces a new law that hands the houses to new owners, moves them about, or both. Each law
// is ridiculous, but it is also a clue: it tells you which kind of house is yours now, or where
// it went. Every law takes your house away from you.
//
// title: the short version on the tower's display. say: what the demon announces (one is picked
// at random). apply: what the law does to the city.

import { PLOTS, POINTY, RESIDENTS, RESIDENT_BY_ID, SHAPES, nameOf } from './city.js'
import { shuffle, topOf } from './town.js'

const pick = (list) => list[Math.floor(Math.random() * list.length)]
const resident = (id) => RESIDENT_BY_ID[id]
const homeOf = (c, id) => c.houses.find((h) => h.owner === id)

// Hands out the houses again. pairs: [which residents, which houses], in order: the residents
// that match get houses that match, as far as they go; everyone left over gets one of the
// houses left over. It deals a few times and keeps the deal where the fewest people keep their
// old house, and where you never do.
function deal(c, pairs = []) {
  const before = Object.fromEntries(c.houses.map((h) => [h.id, h.owner]))
  let best = null
  for (let attempt = 0; attempt < 40; attempt++) {
    const owners = {}
    let people = RESIDENTS.map((r) => r.id)
    let houses = c.houses.map((h) => h.id)
    for (const [who, which] of pairs) {
      const rs = shuffle(people.filter((id) => who(resident(id))))
      const hs = shuffle(houses.filter((i) => which(c.houses[i])))
      const n = Math.min(rs.length, hs.length)
      for (let k = 0; k < n; k++) owners[hs[k]] = rs[k]
      people = people.filter((id) => !rs.slice(0, n).includes(id))
      houses = houses.filter((i) => !hs.slice(0, n).includes(i))
    }
    houses = shuffle(houses)
    people.forEach((id, k) => (owners[houses[k]] = id))
    const kept = c.houses.filter((h) => owners[h.id] === before[h.id])
    const score = kept.length + (kept.some((h) => owners[h.id] === c.player) ? 100 : 0)
    if (!best || score < best.score) best = { owners, score }
    if (score === 0) break
  }
  for (const h of c.houses) h.owner = best.owners[h.id]
  // (if you still kept your house after all that, swap with someone who is not)
  const mine = homeOf(c, c.player)
  if (before[mine.id] === c.player) {
    const other = pick(c.houses.filter((h) => h !== mine))
    ;[mine.owner, other.owner] = [other.owner, mine.owner]
  }
}

// Moves the houses that match `which` onto the plots with the lowest `score`. Houses already on
// one of those plots stay; the others swap places with whatever stood there.
function relocate(c, which, score) {
  const group = c.houses.filter(which)
  const jitter = PLOTS.map(() => Math.random() * 0.01)
  const targets = PLOTS.map((_, i) => i)
    .sort((a, b) => score(PLOTS[a]) + jitter[a] - score(PLOTS[b]) - jitter[b])
    .slice(0, group.length)
  const free = shuffle(targets.filter((p) => !group.some((h) => h.plot === p)))
  for (const h of group) {
    if (targets.includes(h.plot)) continue
    const p = free.pop()
    const there = c.houses.find((o) => o.plot === p)
    if (there) there.plot = h.plot
    h.plot = p
  }
}

const isColour = (colour) => (h) => resident(h.owner).colour === colour
const isShape = (shape) => (h) => resident(h.owner).shape === shape
// The sun sets on the left of the screen, which is where x is small and z is large.
const fromSun = (p) => p.x - p.z
const fromTower = (p) => Math.hypot(p.x, p.z)

export const LAWS = [
  {
    id: 'pointy',
    title: 'Pointy heads, round houses',
    say: [
      'Anyone with a pointy head gets a round house. You’re already sharp enough; no need to live in a building that agrees with you.',
      'Cones! Pyramids! Into the round houses, all of you. Corners on your head AND on your roof? Excessive.',
    ],
    apply: (c) =>
      deal(c, [
        [(r) => POINTY.includes(r.shape), (h) => h.family === 'round'],
        [(r) => !POINTY.includes(r.shape), (h) => h.family === 'angular'],
      ]),
  },
  {
    id: 'green',
    title: 'Green moves to the sun',
    say: [
      'All green residents must move closer to the sun. The city council has approved mandatory photosynthesis.',
      'Green citizens, you look pale. Your houses are hereby moved to the sunny edge. Photosynthesise responsibly.',
    ],
    apply: (c) => {
      deal(c)
      relocate(c, isColour('mint'), fromSun)
    },
  },
  {
    id: 'spheres',
    title: 'Spheres near my tower',
    say: [
      'I like round things. All spheres are to be relocated closer to my tower. This is not corruption. It is taste.',
      'Spheres, come closer. Closer. I want to see you roll past my window. Your houses have already been moved, you’re welcome.',
    ],
    apply: (c) => {
      deal(c)
      relocate(c, isShape('sphere'), fromTower)
    },
  },
  {
    id: 'yellow',
    title: 'Yellow to the edges',
    say: [
      'Yellow is far too loud for the city centre. All yellow residents: as far from my tower as possible! Think about what you’ve done.',
      'Who approved all this yellow? Not me. Yellow houses go to the far edges of town, where I can’t see them squinting at me.',
    ],
    // the farthest spots from the tower
    apply: (c) => {
      deal(c)
      relocate(c, isColour('yellow'), (p) => -fromTower(p))
    },
  },
  {
    id: 'tall',
    title: 'Tall heads, tall houses',
    say: [
      'Cones are the tallest of you, so cones get the tallest houses. Spheres are the roundest, so they get the shortest, in case they roll off.',
      'Height discrimination is now mandatory! Cones: the four tallest houses. Spheres: the four shortest. Everyone else: somewhere in the middle, like your personalities.',
    ],
    apply: (c) => {
      const byHeight = [...c.houses].sort((a, b) => topOf(b.design, b.floors) - topOf(a.design, a.floors))
      const tallest = byHeight.slice(0, 4)
      const shortest = byHeight.slice(-4)
      deal(c, [
        [(r) => r.shape === 'cone', (h) => tallest.includes(h)],
        [(r) => r.shape === 'sphere', (h) => shortest.includes(h)],
      ])
    },
  },
  {
    id: 'boxes',
    title: 'Cubes live in boxes',
    say: [
      'Cubes must live in boxes. Flat roofs, straight walls, no surprises. Boxes inside boxes. It’s called architecture, look it up.',
      'A cube on a dome looks ridiculous. Cubes: flat-topped houses only. Everybody else: shuffle!',
    ],
    apply: (c) => deal(c, [[(r) => r.shape === 'cube', (h) => h.flat]]),
  },
  {
    id: 'chairs',
    title: 'Musical houses',
    say: [
      'Musical chairs, but houses! Cubes take the spheres’ houses, spheres the cones’, cones the pyramids’, pyramids the cubes’. Same colour, new life.',
      'Everyone, move one shape along! Cube to sphere, sphere to cone, cone to pyramid, pyramid back to cube. Keep your colour, lose your sofa.',
    ],
    apply: (c) => {
      const owners = c.houses.map((h) => {
        const { shape, colour } = resident(h.owner)
        // the house of a sphere goes to the cube of the same colour, and so on
        const taker = SHAPES[(SHAPES.indexOf(shape) + SHAPES.length - 1) % SHAPES.length]
        return `${colour}-${taker}`
      })
      c.houses.forEach((h, i) => (h.owner = owners[i]))
    },
  },
  {
    id: 'farnear',
    title: 'Near swaps with far',
    say: [
      'I’m lonely. Whoever lives nearest my tower swaps with whoever lives farthest away. And so on. Love thy neighbour, from a distance.',
      'The neighbours close to me are boring and the ones far away are suspicious. Swap! Nearest with farthest, second nearest with second farthest…',
    ],
    apply: (c) => {
      const order = shuffle(c.houses).sort((a, b) => fromTower(PLOTS[a.plot]) - fromTower(PLOTS[b.plot]))
      const owners = order.map((h) => h.owner).reverse()
      order.forEach((h, i) => (h.owner = owners[i]))
    },
  },
]

// The six laws of the day, in a random order.
export const lawsOfTheDay = () => shuffle(LAWS).slice(0, 6)

// What the demon says before and after the law, so it never sounds quite the same twice.
const OPENERS = [
  '*Yawn*… CUCKOO! Hear ye, hear ye!',
  'Ahem. Ahem. AHEM. Thank you.',
  'Good news! Terrible news! Same news!',
  'I had a dream. It is now legislation.',
  'CUCKOO! Your favourite tyrant is back!',
  'Wake up, little shapes, I have an idea.',
  'By the power vested in me by me:',
]
const CLOSERS = [
  'That is all. Carry on.',
  'No questions. Questions are illegal now.',
  'Back to my nap. Obey!',
  'Effective immediately. Effective forever. Well, for an hour.',
  'Don’t thank me. Actually, do.',
  'I’ve already forgotten why. Doesn’t matter!',
]

export const announce = (law) => ({ opener: pick(OPENERS), text: pick(law.say), closer: pick(CLOSERS) })

// The small notes that pop up when something happens to you.
export const NOTES = {
  evicted: ['Evicted! Find your new home.', 'This isn’t yours any more. Start hopping!', 'New law, new home. Off you bounce!', 'Your desk now belongs to someone else.'],
  home: ['Home! Back to work.', 'This one’s yours. Desk, sweet desk.', 'You’re home. Look busy.', 'Found it! Work resumes.'],
  bump: [
    (o) => `Boing! This is ${o}’s house.`,
    (o) => `Nope. ${o} lives here.`,
    (o) => `Boing, boing. ${o} wants their roof back.`,
    (o) => `Wrong roof. Property of ${o}.`,
  ],
  // what the birds shout when you land on their tree
  birds: ['Get out of my nest!', 'GET OUT OF MY NEST!!', 'Out! Out of my nest!', 'Get out of my nest, you shape!'],
  tower: ['That’s the demon’s tower. Shh, it’s napping.', 'The tower is not a house. It is a lifestyle.', 'No entry. Demon at work. (Sleeping.)'],
  edge: ['The city ends here. Beyond: only sunset.', 'Careful, that’s the edge of the world.'],
}
export const note = (kind, ...args) => {
  const line = pick(NOTES[kind])
  return typeof line === 'function' ? line(...args) : line
}
export const ownerNote = (id) => note('bump', nameOf(id))

// The demon's verdict at sunset. ratio: the share of the day you spent working.
const HOME_GOOD = [
  'What a surprisingly competent citizen. I’m almost disappointed.',
  'You worked more than I slept. Disgusting. Well done.',
  'A model resident! I shall have a tiny statue of you made, and then lose it.',
  'Productive, punctual, perfectly shaped. Are you sure you live in MY city?',
]
const HOME_MEH = [
  'Half working, half wandering. The backbone of any great city: mediocrity.',
  'You spent the day as a part-time citizen and a part-time tourist. Bold.',
  'Not bad. Not good. Beautifully average, like a beige wall.',
  'You found your home eventually. So does water. Water doesn’t get a medal either.',
]
const HOME_BAD = [
  'You made it home, but you worked about as much as a glorified houseplant.',
  'Home just in time for bed. Very efficient. For a sofa.',
  'You spent the whole day searching for a house you had this morning. Iconic.',
  'Congratulations on your career as a professional pedestrian.',
]
const HOMELESS = [
  'Homelessness is caused by poor urban planning. I did the planning. So, by elimination, it’s your fault.',
  'You are now a public monument. Stand still. Pigeons will be along shortly.',
  'Sleeping outside is very good for the bones. Probably. I’ve never had bones.',
  'The city’s first open-air resident! Very modern. Very Bauhaus. Very cold.',
  'Don’t worry. Tomorrow I may pass a law that the street is your house. Or I may not. Goodnight!',
  'I have declared you a roundabout. Traffic will go around you. Sleep well.',
]
export function verdict(home, ratio) {
  if (!home) return pick(HOMELESS)
  return pick(ratio >= 0.6 ? HOME_GOOD : ratio >= 0.3 ? HOME_MEH : HOME_BAD)
}
