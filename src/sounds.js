// The game's sounds, made on the spot by the browser (Web Audio), so there are no sound files to
// load: a soft ping for every hop, crows cawing when you land on a tree, the shop's bell, a happy
// tune when your groceries are home, and the clock tower's bells when the demon pops out with a
// new law. A mute button turns them all off (and on again).
//
// Browsers only allow sound once you have clicked or pressed something on the page; picking your
// shape on the start screen does that, so by the time the game makes a sound, it is allowed.

let audio = null
let master = null // every sound goes through this one volume, which the mute button sets to 0

// Whether the sound is off; remembered for next time, if the browser lets us.
let muted = false
try {
  muted = localStorage.getItem('cuckoo-muted') === '1'
} catch {
  // (no storage: the sound simply starts on)
}

export const isMuted = () => muted
export function setMuted(on) {
  muted = on
  if (master) master.gain.setTargetAtTime(on ? 0 : 1, audio.currentTime, 0.02)
  try {
    localStorage.setItem('cuckoo-muted', on ? '1' : '0')
  } catch {
    // (no storage: it is only forgotten on reload)
  }
}

// The browser's sound engine, started the first time a sound plays.
function ctx() {
  if (!audio) {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return null
    audio = new AudioContext()
    master = audio.createGain()
    master.gain.value = muted ? 0 : 1
    master.connect(audio.destination)
  }
  if (audio.state === 'suspended') audio.resume()
  return audio
}

// A volume that rises quickly to `peak` at `start` and fades away over `length` seconds.
function envelope(a, start, peak, length, attack = 0.01) {
  const gain = a.createGain()
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(peak, start + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length)
  gain.connect(master)
  return gain
}

// A ping for every hop: a bell-like note, a different one each time, from a cheerful five-note scale.
const NOTES = [784, 880, 988, 1175, 1319] // G A B D E
export function ping() {
  const a = ctx()
  if (!a) return
  const now = a.currentTime
  const note = NOTES[Math.floor(Math.random() * NOTES.length)]
  const gain = envelope(a, now, 0.12, 0.35)
  for (const [freq, type] of [
    [note, 'sine'],
    [note * 2, 'triangle'], // a fainter shimmer an octave up
  ]) {
    const osc = a.createOscillator()
    osc.type = type
    osc.frequency.value = freq
    if (type === 'triangle') {
      const soft = a.createGain()
      soft.gain.value = 0.25
      osc.connect(soft).connect(gain)
    } else osc.connect(gain)
    osc.start(now)
    osc.stop(now + 0.4)
  }
}

// A little high note that rings and fades, for the shop's bell and the happy tune.
function tinkle(a, start, freq, volume = 0.1) {
  const gain = envelope(a, start, volume, 0.5)
  const osc = a.createOscillator()
  osc.type = 'triangle'
  osc.frequency.value = freq
  osc.connect(gain)
  osc.start(start)
  osc.stop(start + 0.55)
}

// The shop door's bell, ding-ding, as you pick something up.
export function shopBell() {
  const a = ctx()
  if (!a) return
  const now = a.currentTime
  tinkle(a, now, 1568)
  tinkle(a, now + 0.12, 1318)
}

// A happy rising tune when something on your list is home.
export function delivered() {
  const a = ctx()
  if (!a) return
  const now = a.currentTime
  ;[784, 988, 1175, 1568].forEach((freq, i) => tinkle(a, now + i * 0.09, freq, 0.09))
}

// A second of hiss, for the breath in a crow's caw.
let noise = null
function noiseOf(a) {
  if (!noise) {
    noise = a.createBuffer(1, a.sampleRate, a.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  return noise
}

// A curve that clips the sound hard, which makes it harsh and croaky.
let croak = null
function croakOf() {
  if (!croak) {
    croak = new Float32Array(256)
    for (let i = 0; i < 256; i++) {
      const x = (i / 255) * 2 - 1
      croak[i] = Math.tanh(x * 6)
    }
  }
  return croak
}

// Crows: two to four slow, harsh "KRAA… KRAA… KRAA"s, each rising a little and then dropping.
export function caw() {
  const a = ctx()
  if (!a) return
  const now = a.currentTime
  const count = 2 + Math.floor(Math.random() * 3)
  for (let i = 0; i < count; i++) {
    const start = now + i * 0.42 + Math.random() * 0.06
    const length = 0.3 + Math.random() * 0.08
    const pitch = 360 + Math.random() * 80
    const out = envelope(a, start, 0.22, length, 0.03)
    // the throat: a few bands of the voice ring out more than the rest, like a nasal "aa"
    const throat = a.createGain()
    for (const [freq, q, level] of [
      [1000, 4, 1],
      [1700, 5, 0.8],
      [2700, 6, 0.4],
    ]) {
      const band = a.createBiquadFilter()
      band.type = 'bandpass'
      band.frequency.value = freq
      band.Q.value = q
      const g = a.createGain()
      g.gain.value = level
      throat.connect(band).connect(g).connect(out)
    }
    // the voice: a buzz, clipped hard so it's raspy, and fluttering fast
    const shaper = a.createWaveShaper()
    shaper.curve = croakOf()
    const flutter = a.createGain()
    flutter.gain.value = 0.6
    shaper.connect(flutter).connect(throat)
    const wobble = a.createOscillator()
    const wobbleDepth = a.createGain()
    wobble.frequency.value = 32 + Math.random() * 10
    wobbleDepth.gain.value = 0.4
    wobble.connect(wobbleDepth).connect(flutter.gain)
    for (const detune of [0, 14]) {
      const osc = a.createOscillator()
      osc.type = 'sawtooth'
      osc.detune.value = detune
      osc.frequency.setValueAtTime(pitch, start)
      osc.frequency.linearRampToValueAtTime(pitch * 1.25, start + length * 0.3)
      osc.frequency.linearRampToValueAtTime(pitch * 0.85, start + length)
      osc.connect(shaper)
      osc.start(start)
      osc.stop(start + length + 0.05)
    }
    // and a breath of hiss under it
    const hiss = a.createBufferSource()
    hiss.buffer = noiseOf(a)
    const hissBand = a.createBiquadFilter()
    hissBand.type = 'bandpass'
    hissBand.frequency.value = 1500
    const hissLevel = a.createGain()
    hissLevel.gain.value = 0.25
    hiss.connect(hissBand).connect(hissLevel).connect(throat)
    wobble.start(start)
    hiss.start(start)
    wobble.stop(start + length + 0.05)
    hiss.stop(start + length + 0.05)
  }
}

// One stroke of a big bronze bell: a cluster of tones that don't quite fit together (that's what
// makes a bell sound like a bell), the high ones dying away first and the low hum lingering.
const PARTIALS = [
  [0.5, 0.5], // the hum, an octave below
  [1, 1], // the note itself
  [1.19, 0.45], // a minor third: the bell's slightly sad colour
  [1.5, 0.3],
  [2, 0.55],
  [2.74, 0.25],
  [3.76, 0.12],
]
function bell(a, start, freq, volume, length) {
  for (const [ratio, level] of PARTIALS) {
    const ring = length / Math.sqrt(ratio)
    const gain = envelope(a, start, volume * level, ring, 0.004)
    const osc = a.createOscillator()
    osc.frequency.value = freq * ratio
    osc.connect(gain)
    osc.start(start)
    osc.stop(start + ring + 0.05)
  }
}

// The clock tower rings the hour as the demon wakes: the four-note chime of a big town clock,
// then one deep stroke for every hour (13:00 is one o'clock: one stroke).
const CHIME = [415.3, 370, 329.6, 246.9] // G# F# E B, like Big Ben's first quarter
export function chime(hour) {
  const a = ctx()
  if (!a) return
  const now = a.currentTime
  CHIME.forEach((freq, i) => bell(a, now + i * 0.55, freq, 0.07, 2.4))
  const strokes = ((hour + 11) % 12) + 1
  for (let i = 0; i < strokes; i++) bell(a, now + 2.6 + i * 1.1, 164.8, 0.11, 4)
}
