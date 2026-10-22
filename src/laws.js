// The daemon's absurd laws of ownership. Every full hour it wakes up, forgets the last law and
// makes up a new one, judged by people's hair, height, age, shoe size, arrival time or even the
// letters in their name (see PEOPLE in studio.js).
//
// A law names one or two kinds of tools and a test. Whoever fails the test has to hand those
// tools over; they are shared out among the people who pass, so after a law some people have
// piles of them and others have none. Some laws also hand out the desks again. Seven of the
// twelve laws catch you and take one or two of your tools; the others spare you.

import { PEOPLE } from './studio.js'

// '09:10' → 550 minutes
const arrival = (p) => {
  const [h, m] = p.arrival.split(':').map(Number)
  return h * 60 + m
}
// How light someone's hair is: the red, green and blue of its colour added up (0 to 765).
const lightness = (p) => [1, 3, 5].reduce((sum, i) => sum + parseInt(p.hair.slice(i, i + 2), 16), 0)
const isPrime = (n) => n > 1 && [...Array(n).keys()].slice(2).every((d) => n % d !== 0)

// Everyone, from the lowest score to the highest.
const rank = (score) => [...PEOPLE].sort((a, b) => score(a) - score(b))

// The desks in the order a law hands them out: by the windows first (the left column, back to
// front), or from the back of the room to the front.
const BY_WINDOW = ['desk-1', 'desk-3', 'desk-5', 'desk-2', 'desk-4', 'desk-6']
const BACK_TO_FRONT = ['desk-1', 'desk-2', 'desk-3', 'desk-4', 'desk-5', 'desk-6']

// kinds: the tools this law is about. keeps: who passes the test and may hold them.
// desks (optional): everyone, in order, gets the desks in the order of deskOrder.
export const LAWS = [
  // --- laws that catch you ---
  {
    text: 'Odd shoe sizes are bad luck near sharp corners. Odd feet, hand over your set squares!',
    kinds: ['setsquare'],
    keeps: (p) => p.shoe % 2 === 0,
  },
  {
    text: 'Pencils are only for people whose age is a prime number. Mathematics is beautiful and so are pencils.',
    kinds: ['pencils'],
    keeps: (p) => isPrime(p.age),
  },
  {
    text: 'Rulers are jealous of tall people. Only those over 1.70 m may hold one, so the rulers can look up to them.',
    kinds: ['ruler'],
    keeps: (p) => p.height > 1.7,
  },
  {
    text: 'Anyone with an “o” in their name must give up their books. An “o” is a hole, and books fall through holes.',
    kinds: ['book'],
    keeps: (p) => !p.name.toLowerCase().includes('o'),
  },
  {
    text: 'The early bird gets the worm. Also the pencils. Also the books. Everyone who came after 9:00, hand them over.',
    kinds: ['pencils', 'book'],
    keeps: (p) => arrival(p) < 9 * 60,
  },
  {
    text: 'Even ages are far too balanced. Even-aged people lose their set squares and rulers to the odd ones.',
    kinds: ['setsquare', 'ruler'],
    keeps: (p) => p.age % 2 === 1,
  },
  // --- laws that spare you ---
  {
    text: 'People taller than 1.85 m are clouds now. Clouds cannot hold rulers. Sorry, Roy.',
    kinds: ['ruler'],
    keeps: (p) => p.height <= 1.85,
  },
  {
    text: 'Ginger, blond and silver hair is too shiny for graphite. Pencils go to the brunettes.',
    kinds: ['pencils'],
    keeps: (p) => lightness(p) < 300,
  },
  {
    text: 'Big feet, big ego. Anyone above shoe size 40 hands their books to the small-footed.',
    kinds: ['book'],
    keeps: (p) => p.shoe <= 40,
  },
  {
    text: 'Anyone who arrived after 9:30 is clearly still asleep. Sleepers cannot hold pencils or set squares.',
    kinds: ['pencils', 'setsquare'],
    keeps: (p) => arrival(p) <= 9 * 60 + 30,
  },
  // --- desk laws: everyone moves, and some tools change hands on the way ---
  {
    text: 'Early birds sit by the window! Desks by arrival time. Late birds owe the early birds a set square.',
    kinds: ['setsquare'],
    keeps: (p) => arrival(p) < 9 * 60,
    desks: () => rank(arrival),
    deskOrder: BY_WINDOW,
  },
  {
    text: 'Tall people sit at the back so everyone can see. Short people need rulers more: over 1.75 m, hand yours down.',
    kinds: ['ruler'],
    keeps: (p) => p.height <= 1.75,
    desks: () => rank((p) => -p.height),
    deskOrder: BACK_TO_FRONT,
  },
]

// The laws for one day, in a random order (there are more laws than hours, so no law comes twice).
export function shuffledLaws() {
  const laws = [...LAWS]
  for (let i = laws.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[laws[i], laws[j]] = [laws[j], laws[i]]
  }
  return laws
}

// Everyone's own desk, as at the start of the day.
export const startingDesks = () => Object.fromEntries(PEOPLE.map((p) => [p.id, p.desk]))

// Forgets the old law and applies the new one: every belonging goes back to whoever brought it,
// then those who fail the test hand the law's tools over, shared out in turn among those who pass.
// Returns who sits at which desk now; each belonging gets its new owner and the desk it floats to.
export function applyLaw(law, belongings) {
  const desks = startingDesks()
  if (law.desks) law.desks().forEach((p, i) => (desks[p.id] = law.deskOrder[i]))
  const keepers = PEOPLE.filter(law.keeps).map((p) => p.id)
  const turn = {} // whose turn it is to receive the next one, for each kind
  for (const b of belongings) {
    b.owner = b.origin
    if (law.kinds.includes(b.kind) && !keepers.includes(b.origin)) {
      turn[b.kind] = (turn[b.kind] ?? -1) + 1
      b.owner = keepers[turn[b.kind] % keepers.length]
    }
    b.desk = desks[b.owner]
  }
  return desks
}
