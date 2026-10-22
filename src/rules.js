// The demon's absurd rules of ownership. Every full hour it wakes up, forgets the last rule and
// invents a new one, judged by the residents' colour (they are spheres, so it is their skin), shoe
// size, forgotten dreams or who sneezed last.
//
// After every rule the demon also moves all the houses to new plots, and throws every sphere out
// (see townGame.js), so everyone has to find their home again.
//
// Unlike in the studio, nothing goes back to normal afterwards: the demon forgets its rule, but
// whatever the rule did to the town stays. Buildings change owner, move to another plot, turn,
// float, hang upside down or turn into a different shape, and the next rule starts from there.
//
// text: what the demon announces (it may name names, so it is worked out when the demon wakes).
// apply: what the rule does to the town.

import { OWNER_BY_ID, PLOTS, RESIDENTS, SHAPES, topOf } from './town.js'

const name = (id) => OWNER_BY_ID[id].name
// The same, in the middle of a sentence: “you” instead of “You”.
const who = (id) => (id === 'you' ? 'you' : name(id))
const whose = (id) => (id === 'you' ? 'Your' : `${name(id)}’s`)
const owner = (b) => OWNER_BY_ID[b.owner]
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x))

// Hands a building to someone new, remembering who had it before.
function give(b, to) {
  if (b.owner !== to) b.was = b.owner
  b.owner = to
}

// Whoever sneezed most recently, and whoever sneezed longest ago.
const bySneeze = (t) => [...RESIDENTS].sort((a, b) => t.sneezedAt[a.id] - t.sneezedAt[b.id])
const lastSneezer = (t) => bySneeze(t).at(-1).id
const firstSneezer = (t) => bySneeze(t)[0].id

const tallest = (t) => [...t.buildings].sort((a, b) => topOf(b.shape, b.floors) - topOf(a.shape, a.floors))
const countOf = (t, id) => t.buildings.filter((b) => b.owner === id).length


export const RULES = [
  {
    text: (t) =>
      `Whoever sneezed last owns every round building. The tallest building is round now too, to be fair. Bless you, ${who(lastSneezer(t))}!`,
    apply: (t) => {
      tallest(t)[0].shape = 'drum'
      for (const b of t.buildings) if (b.shape === 'drum' || b.shape === 'dome') give(b, lastSneezer(t))
    },
  },
  {
    text: () => 'Buildings must fit their owners like shoes. Every building now has as many floors as its owner’s shoe size minus 36.',
    apply: (t) => {
      for (const b of t.buildings) b.floors = clamp(owner(b).shoe - 36, 1, 6)
    },
  },
  {
    text: () => 'Architecture must match your skin. Warm-coloured spheres live in pyramids, cool ones in domes. I am plum, so I get towers.',
    apply: (t) => {
      for (const b of t.buildings) b.shape = owner(b).id === 'demon' ? 'tower' : owner(b).warm ? 'pyramid' : 'dome'
    },
  },
  {
    text: () => 'I remember all the dreams you forgot. Every building now floats as high as its owner’s forgotten dream is long.',
    apply: (t) => {
      for (const b of t.buildings) b.lift = Math.round((owner(b).dream.length / 14) * 10) / 10
    },
  },
  {
    text: () => 'Owning things is getting sticky. Everyone, pass all your buildings to your neighbour on the list!',
    apply: (t) => {
      for (const b of t.buildings) {
        const i = RESIDENTS.findIndex((r) => r.id === b.owner)
        if (i >= 0) give(b, RESIDENTS[(i + 1) % RESIDENTS.length].id)
      }
    },
  },
  {
    text: () => 'Every building must turn to face my tower and admire it. The four closest to me are mine now. For safekeeping.',
    apply: (t) => {
      for (const b of t.buildings) {
        const p = PLOTS[b.plot]
        b.rot = Math.atan2(-p.x, -p.z)
      }
      const closest = [...t.buildings].sort((a, b) => PLOTS[a.plot].fromTower - PLOTS[b.plot].fromTower)
      closest.slice(0, 4).forEach((b) => give(b, 'demon'))
    },
  },
  {
    text: () => 'Shoe sizes over 41 are too big for the ground. Their buildings hang upside down in the air. Already upside down? Then right way up. I am fair.',
    apply: (t) => {
      for (const b of t.buildings) {
        if (owner(b).shoe <= 41) continue
        b.flip = !b.flip
        if (b.flip) b.lift = Math.max(b.lift, 1.6)
      }
    },
  },
  {
    text: (t) => `Sneezing steals air, and air is property. ${whose(lastSneezer(t))} buildings go to ${who(firstSneezer(t))}, who sneezed longest ago.`,
    apply: (t) => {
      const thief = lastSneezer(t)
      const to = firstSneezer(t)
      for (const b of t.buildings) if (b.owner === thief) give(b, to)
    },
  },
  {
    text: () => 'An “o” is a hole. Anyone with an “o” in their name now owns arches. Yes, “demon” has an “o” too.',
    apply: (t) => {
      for (const b of t.buildings) if (owner(b).name.toLowerCase().includes('o')) b.shape = 'arch'
    },
  },
  {
    text: (t) => {
      const rested = [...RESIDENTS].sort((a, b) => a.dream.length - b.dream.length)[0]
      return `${rested.name} forgot the shortest dream (“${rested.dream}”), so ${who(rested.id)} must be well rested. The three tallest buildings go to ${who(rested.id)}; everything else floats a little higher.`
    },
    apply: (t) => {
      const rested = [...RESIDENTS].sort((a, b) => a.dream.length - b.dream.length)[0]
      const top = tallest(t).slice(0, 3)
      top.forEach((b) => give(b, rested.id))
      for (const b of t.buildings) if (!top.includes(b)) b.lift = Math.min(4, b.lift + 0.8)
    },
  },
  {
    text: (t) => `It is ${Math.floor(t.minutes / 60)} o’clock, so every building turns by ${Math.floor(t.minutes / 60) * 30}°, and everyone swaps buildings with the person opposite.`,
    apply: (t) => {
      const turn = ((Math.floor(t.minutes / 60) * 30) / 180) * Math.PI
      for (const b of t.buildings) {
        b.rot += turn
        const i = RESIDENTS.findIndex((r) => r.id === b.owner)
        if (i >= 0) give(b, RESIDENTS[(i + RESIDENTS.length / 2) % RESIDENTS.length].id)
      }
    },
  },
  {
    text: () => 'Owning too much is greedy. Whoever owns the most gives half of it to whoever owns the least. I don’t count. I am the rule.',
    apply: (t) => {
      const ranked = [...RESIDENTS].sort((a, b) => countOf(t, a.id) - countOf(t, b.id))
      const poorest = ranked[0].id
      const richest = ranked.at(-1).id
      const theirs = t.buildings.filter((b) => b.owner === richest)
      theirs.slice(0, Math.floor(theirs.length / 2)).forEach((b) => {
        give(b, poorest)
        b.rot += Math.PI / 4 // gifts are turned a little, so they look new
      })
    },
  },
  {
    text: () => 'Shapes are boring when they stay the same. Every building becomes the next shape on my list.',
    apply: (t) => {
      for (const b of t.buildings) b.shape = SHAPES[(SHAPES.indexOf(b.shape) + 1) % SHAPES.length]
    },
  },
]
