// Everything in the studio that isn't the building, a person or a belonging: the desks, a
// drafting table, the bookshelf, a reading corner with two armchairs, plants and pictures.

import { useMemo } from 'react'
import * as THREE from 'three'
import {
  ARMCHAIRS, DESK_SCALE, DESK_SIZE, DESKS, DRAFTING_TABLES, FRAMES, FURNITURE_SCALE as S, PLANTS, READING_CORNER, ROOM, SHELF,
} from './studio.js'
import { artTexture, rng, woodTexture } from './textures.js'
import { BLUE, CHAIR, GREENS, INK, MINT, OAK, PAPER, RED, STEEL, TERRACOTTA, YELLOW } from './palette.js'

const BOOK_TONES = ['#f3e6dc', '#cdbfd8', '#7d7196', '#e6d3c6', '#fbf3ea', '#a99bbd', OAK, '#4f4669']
const POPS = [RED, MINT, YELLOW, BLUE, TERRACOTTA]

// A plain box. `wood` gives it the oak texture.
function Box({ p, s, c = '#ffffff', wood, r, rough = 0.85, shadow = true }) {
  return (
    <mesh position={p} rotation={r} castShadow={shadow} receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial color={wood ? '#ffffff' : c} map={wood ? woodTexture() : null} roughness={rough} />
    </mesh>
  )
}

function Cyl({ p, args, c, r, shadow = true }) {
  return (
    <mesh position={p} rotation={r} castShadow={shadow} receiveShadow>
      <cylinderGeometry args={args} />
      <meshStandardMaterial color={c} roughness={0.7} />
    </mesh>
  )
}

// A flat sheet of paper with a drawing on it, lying on whatever is underneath.
function Sheet({ p, size, art = 'sheet' }) {
  return (
    <mesh position={p} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial map={artTexture(art)} roughness={0.9} />
    </mesh>
  )
}

// The classic architect's lamp: a heavy base and two arms, leaning over the desk.
function ArchitectLamp({ p, shade, rot = 0 }) {
  return (
    <group position={p} rotation={[0, rot, 0]}>
      <Cyl p={[0, 0.015, 0]} args={[0.08, 0.09, 0.03, 16]} c={INK} />
      <Box p={[-0.077, 0.25, 0]} s={[0.02, 0.45, 0.02]} r={[0, 0, 0.35]} c={STEEL} />
      <Box p={[-0.317, 0.516, 0]} s={[0.02, 0.35, 0.02]} r={[0, 0, 1.2]} c={STEEL} />
      <mesh position={[-0.48, 0.52, 0]} castShadow>
        <coneGeometry args={[0.1, 0.17, 16, 1, true]} />
        <meshStandardMaterial color={shade} side={THREE.DoubleSide} roughness={0.6} />
      </mesh>
      <mesh position={[-0.48, 0.45, 0]}>
        <sphereGeometry args={[0.035, 10, 8]} />
        <meshBasicMaterial color="#fff6d6" />
      </mesh>
    </group>
  )
}

function OfficeChair() {
  return (
    <group>
      <Box p={[0, 0.45, 0]} s={[0.46, 0.07, 0.44]} c={CHAIR} />
      <Box p={[0, 0.74, 0.2]} s={[0.46, 0.5, 0.05]} c={CHAIR} />
      <Cyl p={[0, 0.22, 0]} args={[0.03, 0.03, 0.44, 6]} c={STEEL} />
      <Cyl p={[0, 0.03, 0]} args={[0.26, 0.26, 0.04, 5]} c={INK} />
    </group>
  )
}

function Mug({ p, c }) {
  return <Cyl p={[p[0], p[1] + 0.05, p[2]]} args={[0.04, 0.036, 0.1, 14]} c={c} />
}

function PottedHerb({ p }) {
  return (
    <group position={p}>
      <Cyl p={[0, 0.06, 0]} args={[0.07, 0.055, 0.12, 12]} c={TERRACOTTA} />
      <mesh position={[0, 0.17, 0]} castShadow>
        <icosahedronGeometry args={[0.1, 0]} />
        <meshStandardMaterial color={GREENS[2]} flatShading />
      </mesh>
    </group>
  )
}

// Everything lying on a desk is drawn this many times bigger than real, so it reads clearly
// from up in the isometric view. (The belongings are drawn bigger still, in Belongings.jsx.)
export const ITEM_SCALE = 1.5

function Item({ p, children }) {
  return (
    <group position={p} scale={ITEM_SCALE}>
      {children}
    </group>
  )
}

// A desk: oak top on steel legs, a small tilted drafting board with a drawing on it,
// an architect's lamp, and whatever this person keeps lying around. Their belongings
// (pencils, set square, scale ruler, book) are drawn separately, in Belongings.jsx, because
// the daemon will move them around.
export function Desk({ desk, index }) {
  const { w, d, h } = DESK_SIZE
  const stuff = useMemo(() => {
    const rand = rng(index * 97 + 5)
    return {
      mug: [PAPER, RED, MINT, YELLOW, BLUE, INK][index % 6],
      roll: rand() < 0.65,
      herb: rand() < 0.45,
      shade: [INK, RED, INK, MINT, YELLOW, INK][index % 6],
    }
  }, [index])
  return (
    <group position={[desk.x, 0, desk.z]} scale={DESK_SCALE}>
      <Box p={[0, h - 0.025, 0]} s={[w, 0.05, d]} wood />
      {[-1, 1].map((sx) => (
        <Box key={sx} p={[sx * (w / 2 - 0.12), (h - 0.05) / 2, 0]} s={[0.05, h - 0.05, d - 0.12]} c={STEEL} />
      ))}
      <group position={[-0.7, h + 0.13, -0.25]} rotation={[0.3, 0, 0]}>
        <Box p={[0, 0, 0]} s={[1.7, 0.03, 1.0]} c={PAPER} rough={0.6} />
        <Sheet p={[0, 0.017, 0]} size={[1.35, 0.82]} />
        <Box p={[0, 0.03, 0.26]} s={[1.7, 0.02, 0.04]} c={STEEL} />
      </group>
      <Box p={[-0.7, h + 0.12, -0.67]} s={[1.4, 0.24, 0.04]} c={STEEL} />
      <Item p={[w / 2 - 0.25, h, -d / 2 + 0.25]}>
        <ArchitectLamp p={[0, 0, 0]} shade={stuff.shade} />
      </Item>
      <Item p={[1.55, h, 0.35]}>
        <Mug p={[0, 0, 0]} c={stuff.mug} />
      </Item>
      {stuff.roll && <Cyl p={[-1.4, h + 0.05, 0.7]} args={[0.05, 0.05, 0.7, 12]} r={[0, 0, Math.PI / 2]} c={PAPER} />}
      {stuff.herb && (
        <Item p={[0.35, h, -0.65]}>
          <PottedHerb p={[0, 0, 0]} />
        </Item>
      )}
      <group position={[0, 0, d / 2 + 0.3]}>
        <OfficeChair />
      </group>
    </group>
  )
}

// A big drafting table on a steel stand. The board tilts up towards the window; you stand on the room side.
export function DraftingTable({ table }) {
  return (
    <group position={[table.x, 0, table.z]} scale={S}>
      {[-1, 1].map((sz) => (
        <group key={sz}>
          <Box p={[-0.3, 0.46, sz * 0.6]} s={[0.04, 0.92, 0.04]} c={STEEL} />
          <Box p={[0.3, 0.46, sz * 0.6]} s={[0.04, 0.92, 0.04]} c={STEEL} />
          <Box p={[0, 0.06, sz * 0.6]} s={[0.8, 0.04, 0.05]} c={STEEL} />
        </group>
      ))}
      <Box p={[0, 0.5, 0]} s={[0.04, 0.04, 1.2]} c={STEEL} />
      <group position={[0, 1.0, 0]} rotation={[0, 0, -0.38]}>
        <Box p={[0, 0, 0]} s={[table.w, 0.04, table.d]} wood />
        <Sheet p={[0, 0.022, 0]} size={[0.75, 1.1]} art="plan" />
        <Box p={[0.28, 0.04, 0]} s={[0.04, 0.03, table.d]} c={STEEL} />
        <mesh position={[-0.1, 0.03, 0.4]} castShadow>
          <cylinderGeometry args={[0.16, 0.16, 0.01, 3]} />
          <meshStandardMaterial color={MINT} transparent opacity={0.85} />
        </mesh>
      </group>
      {/* a tall stool */}
      <group position={[0.85, 0, 0.2]}>
        <Cyl p={[0, 0.72, 0]} args={[0.18, 0.18, 0.05, 20]} c={OAK} />
        <Cyl p={[0, 0.36, 0]} args={[0.025, 0.025, 0.7, 8]} c={STEEL} />
        <Cyl p={[0, 0.015, 0]} args={[0.2, 0.2, 0.03, 20]} c={INK} />
      </group>
    </group>
  )
}

// The library shelf: an oak frame full of books and binders, with a model and a plant on top.
export function Shelf() {
  const { x, z, w, d, h } = SHELF
  const boards = [0.02, 0.58, 1.14, 1.7, h - 0.02]
  const books = useMemo(() => {
    const rand = rng(7)
    const list = []
    for (const y of boards.slice(0, -1)) {
      let bx = -w / 2 + 0.08
      while (bx < w / 2 - 0.15) {
        if (rand() < 0.06) {
          bx += 0.15 + rand() * 0.25 // a gap
          continue
        }
        const t = 0.04 + rand() * 0.07
        const bh = 0.32 + rand() * 0.18
        const c = rand() < 0.15 ? POPS[Math.floor(rand() * POPS.length)] : BOOK_TONES[Math.floor(rand() * BOOK_TONES.length)]
        list.push({ x: bx + t / 2, y: y + 0.02 + bh / 2, t, h: bh, c })
        bx += t + 0.008
      }
    }
    return list
    // the boards never change
  }, [w])
  return (
    <group position={[x, 0, z]} scale={S}>
      {[-1, 1].map((s) => (
        <Box key={s} p={[s * (w / 2 - 0.02), h / 2, 0]} s={[0.04, h, d]} wood />
      ))}
      {boards.map((y) => (
        <Box key={y} p={[0, y, 0]} s={[w, 0.04, d]} wood />
      ))}
      {books.map((b, i) => (
        <Box key={i} p={[b.x, b.y, 0.02]} s={[b.t, b.h, d - 0.12]} c={b.c} rough={0.9} shadow={false} />
      ))}
      <Box p={[-1.3, h + 0.12, 0]} s={[0.4, 0.2, 0.3]} c={PAPER} />
      <Box p={[-1.2, h + 0.3, 0.02]} s={[0.15, 0.4, 0.15]} c={PAPER} />
      <PottedHerb p={[1.5, h, 0]} />
    </group>
  )
}

// The reading corner: a round terracotta rug and a little round side table with a mug and a
// book on it. The two armchairs around it are drawn by Armchair.
export function ReadingCorner() {
  const { x, z } = READING_CORNER
  return (
    <group position={[x, 0, z]} scale={S}>
      <Cyl p={[0.3, 0.006, 0]} args={[1.0, 1.0, 0.012, 40]} c={TERRACOTTA} shadow={false} />
      <Cyl p={[0.3, 0.012, 0]} args={[0.82, 0.82, 0.012, 40]} c="#e3a17f" shadow={false} />
      <Cyl p={[0, 0.25, 0]} args={[0.05, 0.08, 0.5, 10]} c={STEEL} />
      <Cyl p={[0, 0.51, 0]} args={[0.25, 0.25, 0.03, 24]} c={OAK} />
      <Mug p={[0.08, 0.525, 0.08]} c={MINT} />
      <Box p={[-0.06, 0.545, -0.06]} s={[0.2, 0.04, 0.15]} r={[0, 0.5, 0]} c={BLUE} />
    </group>
  )
}

export function Armchair({ chair }) {
  return (
    <group position={[chair.x, 0, chair.z]} rotation={[0, chair.rot, 0]} scale={S}>
      <Box p={[0, 0.22, 0]} s={[0.85, 0.3, 0.8]} c={chair.color} rough={1} />
      <Box p={[0, 0.62, -0.32]} s={[0.85, 0.55, 0.18]} c={chair.color} rough={1} />
      {[-1, 1].map((s) => (
        <Box key={s} p={[s * 0.35, 0.48, 0.02]} s={[0.16, 0.22, 0.78]} c={chair.color} rough={1} />
      ))}
      <Box p={[0, 0.42, 0.05]} s={[0.55, 0.1, 0.62]} c={chair.color} rough={1} />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <Box key={i} p={[sx * 0.36, 0.035, sz * 0.32]} s={[0.05, 0.07, 0.05]} c={OAK} />
      ))}
    </group>
  )
}

// A plant in a pot: a round bush, a tall leafy one, or a spiky snake plant.
export function Plant({ plant }) {
  const { x, z, kind, s = 1 } = plant
  const parts = useMemo(() => {
    const rand = rng((x + 20) * 131 + (z + 20) * 17)
    const list = []
    if (kind === 'bush') {
      for (let i = 0; i < 8; i++) {
        const a = rand() * Math.PI * 2
        const rr = rand() * 0.18
        list.push({ type: 'ball', p: [Math.cos(a) * rr, 0.55 + rand() * 0.35, Math.sin(a) * rr], r: 0.16 + rand() * 0.12 })
      }
    } else if (kind === 'tall') {
      list.push({ type: 'stem', h: 1.35 })
      for (let i = 0; i < 11; i++) {
        const a = i * 2.4 + rand()
        list.push({ type: 'leaf', p: [Math.cos(a) * 0.18, 0.6 + (i / 11) * 0.95, Math.sin(a) * 0.18], rot: [0.5 * rand(), -a, 0.35] })
      }
    } else {
      for (let i = 0; i < 9; i++) {
        const a = rand() * Math.PI * 2
        list.push({ type: 'blade', p: [Math.cos(a) * 0.08, 0, Math.sin(a) * 0.08], h: 0.5 + rand() * 0.45, rot: [Math.sin(a) * 0.15, a, Math.cos(a) * 0.15] })
      }
    }
    return list
  }, [x, z, kind])
  const pot = kind === 'snake' ? '#cfcdc6' : TERRACOTTA
  return (
    <group position={[x, 0, z]} scale={s * S}>
      <Cyl p={[0, 0.19, 0]} args={[0.22, 0.16, 0.38, 18]} c={pot} />
      <Cyl p={[0, 0.375, 0]} args={[0.2, 0.2, 0.01, 18]} c="#4a3a2c" shadow={false} />
      {parts.map((part, i) => {
        const green = GREENS[i % GREENS.length]
        if (part.type === 'ball')
          return (
            <mesh key={i} position={part.p} castShadow>
              <icosahedronGeometry args={[part.r, 0]} />
              <meshStandardMaterial color={green} flatShading />
            </mesh>
          )
        if (part.type === 'stem') return <Cyl key={i} p={[0, 0.38 + part.h / 2, 0]} args={[0.02, 0.025, part.h, 6]} c="#5b4a35" />
        if (part.type === 'leaf')
          return (
            <mesh key={i} position={part.p} rotation={part.rot} scale={[0.26, 0.05, 0.15]} castShadow>
              <icosahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color={green} flatShading />
            </mesh>
          )
        return (
          <mesh key={i} position={[part.p[0], 0.38 + part.h / 2, part.p[2]]} rotation={part.rot} castShadow>
            <boxGeometry args={[0.07, part.h, 0.02]} />
            <meshStandardMaterial color={i % 2 ? '#4f7a46' : '#62904f'} />
          </mesh>
        )
      })}
    </group>
  )
}

// A picture on the wall: a thin black or oak frame, a white mount and the artwork.
export function Frame({ frame }) {
  const onBack = frame.wall === 'back'
  const position = onBack ? [frame.x, frame.y, -ROOM.d / 2] : [-ROOM.w / 2, frame.y, frame.z]
  const rotation = onBack ? [0, 0, 0] : [0, Math.PI / 2, 0]
  const wood = frame.art === 'plan' || frame.art === 'triangle'
  return (
    <group position={position} rotation={rotation} scale={S}>
      <Box p={[0, 0, 0.025]} s={[frame.w + 0.08, frame.h + 0.08, 0.05]} c={INK} wood={wood} />
      <mesh position={[0, 0, 0.052]}>
        <planeGeometry args={[frame.w, frame.h]} />
        <meshStandardMaterial color={PAPER} />
      </mesh>
      <mesh position={[0, 0, 0.054]}>
        <planeGeometry args={[frame.w - 0.14, frame.h - 0.14]} />
        <meshStandardMaterial map={artTexture(frame.art)} roughness={0.8} />
      </mesh>
    </group>
  )
}

export function Furniture() {
  return (
    <group>
      {DESKS.map((d, i) => (
        <Desk key={d.id} desk={d} index={i} />
      ))}
      {DRAFTING_TABLES.map((t) => (
        <DraftingTable key={t.id} table={t} />
      ))}
      <Shelf />
      <ReadingCorner />
      {ARMCHAIRS.map((c, i) => (
        <Armchair key={i} chair={c} />
      ))}
      {PLANTS.map((p, i) => (
        <Plant key={i} plant={p} />
      ))}
      {FRAMES.map((f, i) => (
        <Frame key={i} frame={f} />
      ))}
    </group>
  )
}
