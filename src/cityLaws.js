// The cuckoo demon's laws, and everything else it says. Every hour it pops out of the tower and
// announces a new law that hands the houses to new owners, moves them about, or both. Each law
// is ridiculous, but it is also a clue: it tells you which kind of house is yours now, or where
// it went. Every law takes your house away from you.
//
// Most laws are made up on the spot (see the law maker below), so they are new every game.
// title: the short version carved on the tower. say: what the demon announces (one is picked at
// random). apply: what the law does to the city.

import { PLOTS, POINTY, RESIDENT_BY_ID, SHAPES, landOf, nameOf } from './city.js'
import { shuffle, topOf } from './town.js'
import { LIST_LENGTH } from './groceries.js'

const pick = (list) => list[Math.floor(Math.random() * list.length)]
const resident = (id) => RESIDENT_BY_ID[id]
const homeOf = (c, id) => c.houses.find((h) => h.owner === id)
// The houses that are in town by now (the others are still on their way, with their owners).
const inTown = (c) => c.houses.filter((h) => h.plot !== null)

// If you still kept your house after a law, or were handed the roof you're standing on, you
// swap with someone else: every law sends you searching.
function evictYou(c, before) {
  const mine = homeOf(c, c.player)
  const under = c.walkers.find((w) => w.id === c.player).house // the house under your feet
  if (before[mine.id] !== c.player && mine.id !== under) return
  const other = pick(inTown(c).filter((h) => h !== mine && h.id !== under && before[h.id] !== c.player))
  ;[mine.owner, other.owner] = [other.owner, mine.owner]
}

// Hands out the houses again. pairs: [which residents, which houses], in order: the residents
// that match get houses that match, as far as they go; everyone left over gets one of the
// houses left over. It deals a few times and keeps the deal where the fewest people keep their
// old house, and where you never do.
function deal(c, pairs = []) {
  const before = Object.fromEntries(c.houses.map((h) => [h.id, h.owner]))
  let best = null
  for (let attempt = 0; attempt < 40; attempt++) {
    const owners = {}
    let people = inTown(c).map((h) => h.owner)
    let houses = inTown(c).map((h) => h.id)
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
    const kept = inTown(c).filter((h) => owners[h.id] === before[h.id])
    const score = kept.length + (kept.some((h) => owners[h.id] === c.player) ? 100 : 0)
    if (!best || score < best.score) best = { owners, score }
    if (score === 0) break
  }
  for (const h of inTown(c)) h.owner = best.owners[h.id]
  evictYou(c, before)
}

// Moves the houses that match `which` onto the plots (of the city as it is now) with the lowest `score`. Houses already on
// one of those plots stay; the others swap places with whatever stood there.
function relocate(c, which, score) {
  const group = inTown(c).filter(which)
  const jitter = PLOTS.map(() => Math.random() * 0.01)
  const targets = landOf(c.stage)
    .filter((p) => p !== c.store) // (never onto the shop)
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

const fromTower = (p) => Math.hypot(p.x, p.z)
// The sun sets on the left of the screen, which is where x is small and z is large.
const fromSun = (p) => p.x - p.z
const height = (h) => topOf(h.design, h.floors)
// The middle height of the houses in town: the tall ones are above it, the short ones below.
const middleHeight = (c) => {
  const hs = inTown(c).map(height).sort((a, b) => a - b)
  return hs[Math.floor(hs.length / 2)]
}

// --- the law maker ---
// Most laws are made on the spot from three parts: WHO it is about, WHERE they must live now (a
// kind of house, or a part of town), and WHY (always a silly reason). So the demon hardly ever
// says the same thing twice, and every law is still a clue.

// who: which residents. jokes: reasons that only fit them.
const WHO = [
  { id: 'red', name: 'Coral shapes', who: (r) => r.colour === 'red', jokes: ['Coral is too loud.', 'You look like a warning sign.'] },
  { id: 'mint', name: 'Green shapes', who: (r) => r.colour === 'mint', jokes: ['Green means go. So go.', 'You remind me of salad.'] },
  { id: 'lilac', name: 'Lavender shapes', who: (r) => r.colour === 'lilac', jokes: ['You smell like soap.', 'Lavender is calming. I hate calm.'] },
  { id: 'yellow', name: 'Yellow shapes', who: (r) => r.colour === 'yellow', jokes: ['Yellow hurts my eyes.', 'You look like tiny suns. Suspicious.'] },
  { id: 'pink', name: 'Pink shapes', who: (r) => r.colour === 'pink', jokes: ['Too cute. Very suspicious.', 'You look like bubblegum.'] },
  { id: 'teal', name: 'Teal shapes', who: (r) => r.colour === 'teal', jokes: ['Blue or green? Pick one!', 'You remind me of a swimming pool.'] },
  { id: 'orange', name: 'Orange shapes', who: (r) => r.colour === 'orange', jokes: ['You look juicy.', 'Orange rhymes with nothing. Shame.'] },
  { id: 'lime', name: 'Lime shapes', who: (r) => r.colour === 'lime', jokes: ['Too sour.', 'You glow in the dark. Probably.'] },
  { id: 'blue', name: 'Blue shapes', who: (r) => r.colour === 'blue', jokes: ['Cheer up, blue ones.', 'You look like Mondays.'] },
  { id: 'cube', name: 'Cubes', who: (r) => r.shape === 'cube', jokes: ['Cubes can’t roll. Sad.', 'Six sides. Six problems.'] },
  { id: 'sphere', name: 'Spheres', who: (r) => r.shape === 'sphere', jokes: ['Spheres roll too much.', 'No corners? No trust.'] },
  { id: 'cone', name: 'Cones', who: (r) => r.shape === 'cone', jokes: ['You look like ice cream.', 'Traffic cones, all of you.'] },
  { id: 'pyramid', name: 'Pyramids', who: (r) => r.shape === 'pyramid', jokes: ['Egypt called. It wants you back.', 'Very pointy. Very rude.'] },
  { id: 'pointy', name: 'Pointy heads', who: (r) => POINTY.includes(r.shape), jokes: ['You keep popping my balloons.', 'Too sharp for my taste.'] },
  { id: 'corners', name: 'Corner folk', who: (r) => r.shape === 'cube' || r.shape === 'pyramid', jokes: ['Corners collect dust.', 'Mind your edges.'] },
]

// Where they must live: a kind of house (house: which houses, worked out when the law is passed),
// or a part of town (place: the lower the score of a spot, the better it fits).
const WHERE = [
  { id: 'round', short: 'round houses', long: 'round houses', house: () => (h) => h.family === 'round', jokes: ['Round houses have no corners to sulk in.'] },
  { id: 'boxy', short: 'boxy houses', long: 'boxy houses', house: () => (h) => h.family === 'angular', jokes: ['Boxes are honest.'] },
  { id: 'flat', short: 'flat roofs', long: 'houses with flat roofs', house: () => (h) => h.flat, jokes: ['Flat roofs are good for dancing.'] },
  { id: 'tall', short: 'tall houses', long: 'the tall houses', house: (c) => (h) => height(h) >= middleHeight(c), jokes: ['Closer to the clouds. Closer to me.'] },
  { id: 'short', short: 'short houses', long: 'the short houses', house: (c) => (h) => height(h) <= middleHeight(c), jokes: ['Less house to clean.'] },
  { id: 'tower', short: 'near the tower', long: 'near my tower', place: fromTower, jokes: ['I want to watch you.', 'I get lonely up here.'] },
  { id: 'edge', short: 'the far edges', long: 'to the far edges', place: (p) => -fromTower(p), jokes: ['I can’t see you from here. Good.'] },
  { id: 'sun', short: 'the sunny side', long: 'to the sunny side', place: fromSun, jokes: ['Free tan included.', 'Photosynthesise!'] },
  { id: 'shade', short: 'the shady side', long: 'to the shady side', place: (p) => -fromSun(p), jokes: ['Shady folk, shady side.'] },
  { id: 'front', short: 'the front', long: 'to the front', place: (p) => -(p.x + p.z), jokes: ['Smile for the camera.'] },
  { id: 'back', short: 'the back', long: 'to the back', place: (p) => p.x + p.z, jokes: ['Out of sight, out of mind.'] },
]

// The silly reasons that fit any law.
const WHY = [
  'Why? I sneezed.',
  'I dreamt it. So it’s true.',
  'My horoscope said so.',
  'A pigeon told me.',
  'Because it’s Tuesday.',
  'I flipped a coin. Twice.',
  'Don’t ask. I won’t remember.',
  'It’s good feng shui. Probably.',
  'Very Bauhaus. Very modern.',
  'My cuckoo insisted.',
  'For balance. Or chaos.',
  'It looks nicer from up here.',
  'Science! (Not really.)',
  'I was bored.',
  'It rhymes. Almost.',
]

// How the demon words it: {Who} at the start of a sentence, {who} in the middle.
const HOUSE_ORDERS = ['{Who}: {where} only.', '{Who}, into {where}. Now!', '{Who} now live in {where}.', 'New rule: {who} get {where}.']
const PLACE_ORDERS = ['{Who}, move {where}.', '{Who}: {where}. Go!', 'All {who}, {where}. Shoo!', '{Who}, pack up! Off {where}.']

// One law made of who and where, with fresh words.
function madeLaw(who, where) {
  const order = pick(where.place ? PLACE_ORDERS : HOUSE_ORDERS)
    .replace('{Who}', who.name)
    .replace('{who}', who.name.toLowerCase())
    .replace('{where}', where.long)
  const why = pick([...WHY, ...WHY, ...who.jokes, ...where.jokes])
  return {
    id: `${who.id}-${where.id}`,
    title: `${who.name}: ${where.short}`,
    say: [`${order} ${why}`],
    who: who.who,
    apply: (c) => {
      if (where.place) {
        deal(c)
        relocate(c, (h) => who.who(resident(h.owner)), where.place)
      } else deal(c, [[who.who, where.house(c)]])
    },
  }
}

// A few special laws, which move everyone at once.
const SPECIAL = [
  {
    id: 'tall',
    title: 'Cones up, spheres down',
    say: ['Cones get the tallest houses. Spheres get the shortest. In case they roll off.', 'Tall heads, tall houses. Spheres: stay low.'],
    who: (r) => r.shape === 'cone' || r.shape === 'sphere',
    apply: (c) => {
      const byHeight = inTown(c).sort((a, b) => height(b) - height(a))
      const n = Math.max(1, Math.floor(byHeight.length / 4))
      const tallest = byHeight.slice(0, n)
      const shortest = byHeight.slice(-n)
      deal(c, [
        [(r) => r.shape === 'cone', (h) => tallest.includes(h)],
        [(r) => r.shape === 'sphere', (h) => shortest.includes(h)],
      ])
    },
  },
  {
    id: 'chairs',
    title: 'Musical houses',
    say: ['Musical houses! Cubes take the spheres’ homes. Spheres take the cones’. And so on. Same colour only.', 'Everyone, one shape along! Cubes get the spheres’ houses, and so on. Keep your colour.'],
    who: () => true,
    apply: (c) => {
      const before = Object.fromEntries(c.houses.map((h) => [h.id, h.owner]))
      // the house of a sphere goes to the cube of the same colour, and so on, among those of each
      // colour who are in town; whoever is the only one of their colour goes round with the
      // others like them
      const byColour = {}
      for (const h of inTown(c)) (byColour[resident(h.owner).colour] ??= []).push(h)
      const groups = Object.values(byColour)
      const lonely = groups.filter((g) => g.length === 1).flat()
      for (const group of [...groups.filter((g) => g.length > 1), lonely]) {
        group.sort((a, b) => SHAPES.indexOf(resident(a.owner).shape) - SHAPES.indexOf(resident(b.owner).shape))
        const owners = group.map((h) => h.owner)
        group.forEach((h, i) => (h.owner = owners[(i + owners.length - 1) % owners.length]))
      }
      evictYou(c, before)
    },
  },
  {
    id: 'farnear',
    title: 'Near swaps with far',
    say: ['Near my tower? Swap with someone far away. I need new faces.', 'Close ones go far. Far ones come close. I’m bored.'],
    who: () => true,
    apply: (c) => {
      const order = shuffle(inTown(c)).sort((a, b) => fromTower(PLOTS[a.plot]) - fromTower(PLOTS[b.plot]))
      const before = Object.fromEntries(c.houses.map((h) => [h.id, h.owner]))
      const owners = order.map((h) => h.owner).reverse()
      order.forEach((h, i) => (h.owner = owners[i]))
      evictYou(c, before)
    },
  },
]

// Every law the demon could pass: all the made ones, and the special ones.
const LAWS = [...WHO.flatMap((who) => WHERE.map((where) => ({ id: `${who.id}-${where.id}`, who: who.who }))), ...SPECIAL]

// The laws of the last few games, remembered (if the browser lets us), so a new game brings new laws.
const RECENT_KEY = 'cuckoo-recent-laws'
const RECENT_MAX = 40
function recentLaws() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY)) ?? []
  } catch {
    return []
  }
}
function remember(id) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...recentLaws().filter((r) => r !== id)].slice(0, RECENT_MAX)))
  } catch {
    // (no storage: it simply forgets)
  }
}

// The demon thinks up the next law: one it hasn't passed today, nor lately, about at least two
// residents who are in town (so it does something), in fresh words.
export function nextLaw(c) {
  const today = c.laws.map((l) => l.id)
  const recent = recentLaws()
  const residents = inTown(c).map((h) => resident(h.owner))
  const fits = LAWS.filter((law) => !today.includes(law.id) && residents.filter(law.who).length >= 2)
  const fresh = fits.filter((law) => !recent.includes(law.id))
  const { id } = pick(fresh.length ? fresh : fits.length ? fits : LAWS)
  remember(id)
  const special = SPECIAL.find((s) => s.id === id)
  if (special) return special
  const [whoId, whereId] = id.split('-')
  return madeLaw(
    WHO.find((w) => w.id === whoId),
    WHERE.find((w) => w.id === whereId),
  )
}

// What the demon says before and after the law, so it never sounds quite the same twice.
const OPENERS = [
  'CUCKOO! Hear ye!',
  '*Yawn*… new law!',
  'Ahem. AHEM.',
  'Good news! Bad news! Same news!',
  'I had a dream.',
  'Your favourite tyrant is back!',
  'Wake up, little shapes!',
  'By the power of me:',
  'Attention, please!',
  'Big announcement. Tiny demon.',
]
const CLOSERS = [
  'That is all.',
  'No questions.',
  'Back to my nap.',
  'Valid for one hour. Maybe.',
  'You’re welcome.',
  'I already forgot why.',
  'Obey! Then hop.',
  'CUCKOO!',
]

export const announce = (law) => ({ opener: pick(OPENERS), text: pick(law.say), closer: pick(CLOSERS) })

// The small notes that pop up when something happens to you.
export const NOTES = {
  evicted: ['Evicted! Find your new home.', 'This isn’t yours any more. Start hopping!', 'New law, new home. Off you bounce!', 'Your fridge now belongs to someone else.'],
  home: ['Home! Now go shopping.', 'This one’s yours. Fridge, sweet fridge.', 'You’re home. The shop is waiting.', 'Found it! Off to the shop.'],
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

// The demon's verdict at sunset: whether you made it home, and whether the whole list got there.
// Home without everything on the list, you go to sleep hungry.
const ALL_DONE = [
  'All fifteen! Your fridge is full. I’m almost proud.',
  'Every single thing. Show-off.',
  'A full list! I shall make a law against you tomorrow.',
]
const SOME_DONE = [
  'Half a dinner is no dinner. Sleep hungry, little shape.',
  'The list was not finished. Neither is your supper. Goodnight, rumbly tummy.',
  'Some groceries, but not enough. You go to bed hungry. I’ll have a snack for you.',
]
const NONE_DONE = [
  'Home, but the fridge is empty. You go to sleep hungry. Enjoy your air soup.',
  'Zero groceries. Bold diet. Sleep tight, hungry one.',
  'You went shopping and bought… nothing. Off to bed with an empty tummy.',
]
const HOMELESS = [
  'You are now a public monument. Pigeons are on their way.',
  'Sleeping outside is good for the bones. Probably.',
  'The city’s first open-air resident! Very Bauhaus. Very cold.',
  'I declare you a roundabout. Sleep well.',
]
export function verdict(home, delivered) {
  if (!home) return pick(HOMELESS)
  return pick(delivered >= LIST_LENGTH ? ALL_DONE : delivered > 0 ? SOME_DONE : NONE_DONE)
}
