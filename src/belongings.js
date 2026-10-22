// What everyone owns: four things each, lying on their own desk at the start of the day.
// You can only work with things you own; each task needs two of them (see tasks.js).
// Every full hour the daemon's new law hands them to new owners (see laws.js).

import { PEOPLE } from './studio.js'

// The four kinds of belongings, and where each one lies on a desk (measured from the middle
// of the desk, in real size, like the rest of the desk).
export const KINDS = [
  { kind: 'pencils', label: 'pencils', slot: [0.0, 0.6] },
  { kind: 'setsquare', label: 'set square', slot: [-0.6, 0.62] },
  { kind: 'ruler', label: 'scale ruler', slot: [0.75, 0.62] },
  { kind: 'book', label: 'reference book', slot: [0.95, -0.2] },
]
export const LABEL = Object.fromEntries(KINDS.map((k) => [k.kind, k.label]))

export const PLAYER = PEOPLE.find((p) => p.player)

// Everyone's belongings: who brought each one (origin), who owns it now, and on which desk it lies.
export function createBelongings() {
  return PEOPLE.flatMap((p) =>
    KINDS.map((k) => ({ id: `${p.id}-${k.kind}`, kind: k.kind, origin: p.id, owner: p.id, desk: p.desk })),
  )
}

// The kinds of tools you have none of right now, because the daemon's law gave them away.
export function missingKinds(belongings) {
  return KINDS.map((k) => k.kind).filter((kind) => !belongings.some((b) => b.kind === kind && b.owner === PLAYER.id))
}
