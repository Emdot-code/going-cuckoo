// Your grocery day: six things to fetch from the shop, one at a time, and carry home. The list is
// picked at random from these every game.

import { shuffle } from './town.js'

export const LIST_LENGTH = 6

const GROCERIES = [
  { name: 'milk', icon: '🥛' },
  { name: 'bread', icon: '🍞' },
  { name: 'eggs', icon: '🥚' },
  { name: 'apples', icon: '🍎' },
  { name: 'cheese', icon: '🧀' },
  { name: 'carrots', icon: '🥕' },
  { name: 'bananas', icon: '🍌' },
  { name: 'tomatoes', icon: '🍅' },
  { name: 'fish', icon: '🐟' },
  { name: 'broccoli', icon: '🥦' },
  { name: 'honey', icon: '🍯' },
  { name: 'coffee', icon: '☕' },
  { name: 'lemons', icon: '🍋' },
  { name: 'butter', icon: '🧈' },
  { name: 'rice', icon: '🍚' },
  { name: 'cookies', icon: '🍪' },
]

// Today's list. done: whether it is home yet.
export const listOfTheDay = () => shuffle(GROCERIES).slice(0, LIST_LENGTH).map((g) => ({ ...g, done: false }))
