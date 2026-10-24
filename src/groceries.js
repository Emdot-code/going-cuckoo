// Your grocery day: fifteen things to fetch from the shop, one at a time, and carry home. The list
// is picked at random from these every game. Each one has its own little drawing (GroceryIcon.jsx).

import { shuffle } from './town.js'

export const LIST_LENGTH = 15

const GROCERIES = [
  'milk',
  'bread',
  'eggs',
  'apples',
  'cheese',
  'carrots',
  'bananas',
  'tomatoes',
  'fish',
  'broccoli',
  'honey',
  'coffee',
  'lemons',
  'butter',
  'rice',
  'cookies',
  'pasta',
  'potatoes',
  'onions',
  'grapes',
  'strawberries',
  'avocados',
  'corn',
  'peppers',
  'chocolate',
  'tea',
]

// Today's list. done: whether it is home yet.
export const listOfTheDay = () => shuffle(GROCERIES).slice(0, LIST_LENGTH).map((name) => ({ name, done: false }))
