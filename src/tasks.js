// Today's work, split into three smaller tasks. Each one is done in its own place in the studio
// and needs its own pair of tools, so when the daemon takes one of your tools there is usually
// another task you can still get on with:
//
//   floor plan       at your desk            pencils + scale ruler
//   section          at the drafting table   set square + scale ruler
//   precedent study  in the reading corner   reference book + pencils

import { MINT, YELLOW, BLUE } from './palette.js'

// How many studio minutes of work each task takes. Three tasks: 4½ hours of work in a 9-hour day.
export const TASK_MINUTES = 90

// spot: where you stand to work on it, in metres (the floor plan is at whichever desk is yours).
// lines: the drawing in the task panel, drawn line by line as you work, on a 160 × 110 sheet.
export const TASKS = [
  {
    id: 'plan',
    name: 'Floor plan',
    place: 'your desk',
    tools: ['pencils', 'ruler'],
    colour: MINT,
    spot: null,
    lines: [
      [10, 10, 150, 10], [150, 10, 150, 100], [150, 100, 10, 100], [10, 100, 10, 10],
      [70, 10, 70, 45], [70, 65, 70, 100], [10, 55, 50, 55], [70, 55, 150, 55],
      [110, 55, 110, 100], [110, 10, 110, 30],
    ],
  },
  {
    id: 'section',
    name: 'Section',
    place: 'the drafting table',
    tools: ['setsquare', 'ruler'],
    colour: YELLOW,
    spot: { x: -4.45, z: -3.9 }, // on the room side of the drafting table, by its stool
    lines: [
      [5, 100, 155, 100], // the ground
      [30, 100, 30, 40], [130, 100, 130, 40], // the outer walls
      [30, 70, 130, 70], // the first floor
      [20, 42, 80, 10], [80, 10, 140, 42], // the roof
      [80, 70, 80, 100], // a wall inside
      [45, 55, 65, 55], [95, 55, 115, 55], // windows upstairs
      [100, 100, 100, 82], [100, 82, 112, 82], [112, 82, 112, 100], // the front door
    ],
  },
  {
    id: 'research',
    name: 'Precedent study',
    place: 'the reading corner',
    tools: ['book', 'pencils'],
    colour: BLUE,
    spot: { x: -4.7, z: 4.0 }, // in front of the two armchairs
    lines: [
      [15, 100, 145, 100], [20, 92, 140, 92], // the steps of a little temple
      [35, 92, 35, 45], [60, 92, 60, 45], [100, 92, 100, 45], [125, 92, 125, 45], // columns
      [25, 45, 135, 45], [25, 38, 135, 38], // the beam on top
      [25, 38, 80, 12], [80, 12, 135, 38], // the pediment
    ],
  },
]

export const TASK_BY_ID = Object.fromEntries(TASKS.map((t) => [t.id, t]))
