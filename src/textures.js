// Surfaces painted in code (no image files): flat wall panels, a floor of muted tiles, oak,
// and the little artworks in the frames on the walls. The walls and floor are kept flat and
// calm on purpose, like the stone in Monument Valley: no grain, no stains, only the joints.

import * as THREE from 'three'
import { BLUE, CONCRETE, FLOOR, FLOOR_ALT, INK, MINT, OAK, PAPER, RED, TERRACOTTA, YELLOW } from './palette.js'

// A repeatable random sequence, so the textures look the same every time the page loads.
export function rng(seed) {
  let s = Math.abs(Math.floor(seed)) % 2147483646 + 1
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

const cache = {}
function cached(key, make) {
  return cache[key] ?? (cache[key] = make())
}

function canvasTexture(size, draw) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  draw(c.getContext('2d'), size)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 8
  return t
}

// A copy of a texture that repeats rx times across and ry times up.
export function repeated(tex, rx, ry) {
  const t = tex.clone()
  t.repeat.set(rx, ry)
  t.needsUpdate = true
  return t
}

// Muted striped wallpaper. One tile is 2 x 2 m: eight vertical stripes of 25 cm, a wide pale
// one and a narrow darker one in turn, with a fine line between them.
export const concreteTexture = () =>
  cached('concrete', () =>
    canvasTexture(256, (g, s) => {
      g.fillStyle = CONCRETE
      g.fillRect(0, 0, s, s)
      const stripe = s / 8
      for (let i = 0; i < 8; i++) {
        const x = i * stripe
        g.fillStyle = 'rgba(255,255,255,0.18)'
        g.fillRect(x, 0, stripe * 0.6, s)
        g.fillStyle = 'rgba(91,74,110,0.07)'
        g.fillRect(x + stripe * 0.6, 0, stripe * 0.4, s)
        g.fillStyle = 'rgba(255,255,255,0.4)'
        g.fillRect(x + stripe * 0.6 - 1, 0, 1.5, s)
      }
    }),
  )

// Floor tiles. One texture tile is 3 x 3 m: four 1.5 m tiles in two muted tones, like a
// chequerboard, with a thin joint.
export const floorTexture = () =>
  cached('floor', () =>
    canvasTexture(256, (g, s) => {
      const h = s / 2
      for (let i = 0; i < 4; i++) {
        g.fillStyle = (i % 2) ^ (i >> 1) ? FLOOR_ALT : FLOOR
        g.fillRect((i % 2) * h, (i >> 1) * h, h, h)
      }
      g.fillStyle = 'rgba(255,255,255,0.45)'
      g.fillRect(0, 0, s, 2)
      g.fillRect(0, h, s, 2)
      g.fillRect(0, 0, 2, s)
      g.fillRect(h, 0, 2, s)
    }),
  )

// Oak planks with a fine grain.
export const woodTexture = () =>
  cached('wood', () =>
    canvasTexture(512, (g, s) => {
      const rand = rng(5)
      g.fillStyle = OAK
      g.fillRect(0, 0, s, s)
      const rows = 6
      const h = s / rows
      for (let i = 0; i < rows; i++) {
        const y = i * h
        g.fillStyle = rand() < 0.5 ? `rgba(90,50,20,${rand() * 0.12})` : `rgba(255,240,210,${rand() * 0.12})`
        g.fillRect(0, y, s, h)
        g.strokeStyle = 'rgba(90,55,25,0.16)'
        g.lineWidth = 1
        for (let k = 0; k < 16; k++) {
          const base = y + rand() * h
          const amp = 1 + rand() * 3
          const freq = 0.01 + rand() * 0.02
          g.beginPath()
          for (let x = 0; x <= s; x += 8) g.lineTo(x, base + Math.sin(x * freq + k) * amp)
          g.stroke()
        }
        g.fillStyle = 'rgba(70,40,15,0.35)'
        g.fillRect(0, y, s, 1.5)
      }
    }),
  )

// The artworks in the frames, and the drawings on the desks.
export const artTexture = (kind) => cached('art-' + kind, () => canvasTexture(256, (g, s) => ART[kind](g, s)))

const ART = {
  // a floor plan, of course
  plan(g, s) {
    g.fillStyle = PAPER
    g.fillRect(0, 0, s, s)
    g.fillStyle = MINT
    g.globalAlpha = 0.5
    g.fillRect(40, 140, 90, 76)
    g.globalAlpha = 1
    g.strokeStyle = INK
    g.lineWidth = 8
    g.strokeRect(40, 40, 176, 176)
    g.lineWidth = 5
    g.beginPath()
    g.moveTo(130, 40)
    g.lineTo(130, 110)
    g.moveTo(130, 150)
    g.lineTo(130, 216)
    g.moveTo(40, 140)
    g.lineTo(100, 140)
    g.stroke()
    g.lineWidth = 1.5
    g.beginPath()
    g.arc(130, 110, 40, Math.PI / 2, Math.PI)
    g.stroke()
    g.fillStyle = RED
    g.beginPath()
    g.arc(176, 90, 16, 0, Math.PI * 2)
    g.fill()
  },
  circle(g, s) {
    g.fillStyle = YELLOW
    g.fillRect(0, 0, s, s)
    g.fillStyle = RED
    g.beginPath()
    g.arc(s * 0.45, s * 0.55, s * 0.3, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = INK
    g.save()
    g.translate(s / 2, s / 2)
    g.rotate(-0.6)
    g.fillRect(-s * 0.6, -6, s * 1.2, 12)
    g.restore()
  },
  // homage to the square
  squares(g, s) {
    const tones = ['#9aa7a3', MINT, '#d8efe6', YELLOW]
    tones.forEach((c, i) => {
      const m = i * 26
      g.fillStyle = c
      g.fillRect(m, m * 1.3, s - m * 2, s - m * 2)
    })
  },
  triangle(g, s) {
    g.fillStyle = '#e8e6df'
    g.fillRect(0, 0, s, s)
    g.fillStyle = BLUE
    g.beginPath()
    g.arc(s * 0.68, s * 0.32, s * 0.18, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = RED
    g.beginPath()
    g.moveTo(s * 0.15, s * 0.85)
    g.lineTo(s * 0.5, s * 0.25)
    g.lineTo(s * 0.85, s * 0.85)
    g.fill()
    g.fillStyle = INK
    g.fillRect(s * 0.1, s * 0.88, s * 0.8, 6)
  },
  stripes(g, s) {
    const tones = [RED, PAPER, YELLOW, INK, MINT, PAPER, BLUE, TERRACOTTA, PAPER, YELLOW, INK, MINT]
    const w = s / tones.length
    tones.forEach((c, i) => {
      g.fillStyle = c
      g.fillRect(i * w, 0, w + 1, s)
    })
  },
  // a building section, drawn as a blueprint
  section(g, s) {
    g.fillStyle = '#26344d'
    g.fillRect(0, 0, s, s)
    g.strokeStyle = '#dfe8f5'
    g.lineWidth = 3
    g.beginPath()
    g.moveTo(20, 220)
    g.lineTo(236, 220)
    for (const [x0, x1, y] of [[40, 216, 170], [40, 180, 120], [70, 180, 70]]) {
      g.moveTo(x0, y)
      g.lineTo(x1, y)
      g.lineTo(x1, 220)
      g.moveTo(x0, y)
      g.lineTo(x0, 220)
    }
    g.stroke()
    g.lineWidth = 1
    g.setLineDash([4, 4])
    g.beginPath()
    g.moveTo(10, 40)
    g.lineTo(246, 40)
    g.stroke()
  },
  // a drawing in progress, pinned to a drafting board
  sheet(g, s) {
    g.fillStyle = PAPER
    g.fillRect(0, 0, s, s)
    g.strokeStyle = 'rgba(42,44,47,0.7)'
    g.lineWidth = 3
    g.strokeRect(30, 30, 140, 120)
    g.lineWidth = 1.5
    g.beginPath()
    g.moveTo(100, 30)
    g.lineTo(100, 150)
    g.moveTo(30, 90)
    g.lineTo(100, 90)
    g.moveTo(170, 60)
    g.lineTo(230, 60)
    g.lineTo(230, 200)
    g.lineTo(60, 200)
    g.lineTo(60, 150)
    g.stroke()
    g.strokeStyle = 'rgba(42,44,47,0.3)'
    for (let y = 214; y < 246; y += 8) {
      g.beginPath()
      g.moveTo(150, y)
      g.lineTo(240, y)
      g.stroke()
    }
  },
}
