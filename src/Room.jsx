// The building itself: a floor of muted tiles on a slab that floats in the sky, like a
// block from Monument Valley, striped wallpapered walls with three tall windows and a pale coping on
// top, and the sunlight pouring in. The front and right walls are left out, as in a cut-away
// drawing, and the cut surfaces are drawn in soft mauve, as in a section.

import { useMemo } from 'react'
import * as THREE from 'three'
import { ROOM, SUN_DIR, WINDOWS } from './studio.js'
import { concreteTexture, floorTexture, repeated } from './textures.js'
import { GLASS, POCHE, STEEL, SUN, TRIM } from './palette.js'

const noRaycast = () => null

// The order three.js uses for the faces of a box.
const FACE = { right: 0, left: 1, top: 2, bottom: 3, front: 4, back: 5 }

// A block of wall. The faces listed in `cut` are drawn as section cuts.
function Concrete({ position, size, cut = [] }) {
  const key = size.join() + '|' + cut.join()
  const materials = useMemo(() => {
    const [w, h, d] = size
    // the cladding tile is 2 x 2 m, laid along the length of the wall
    const face = new THREE.MeshStandardMaterial({ map: repeated(concreteTexture(), Math.max(w, d) / 2, h / 2), roughness: 0.95 })
    const poche = new THREE.MeshStandardMaterial({ color: POCHE, roughness: 1 })
    return [0, 1, 2, 3, 4, 5].map((i) => (cut.includes(i) ? poche : face))
  }, [key]) // made again only when the size or the cut faces change
  return (
    <mesh position={position} material={materials} castShadow receiveShadow>
      <boxGeometry args={size} />
    </mesh>
  )
}

export function Floor() {
  const { w, d, wallT: t, slab } = ROOM
  const materials = useMemo(() => {
    const top = new THREE.MeshStandardMaterial({ map: repeated(floorTexture(), (w + t) / 3, (d + t) / 3), roughness: 0.9 })
    const poche = new THREE.MeshStandardMaterial({ color: POCHE, roughness: 1 })
    return [poche, poche, top, poche, poche, poche]
  }, [w, d, t])
  return (
    <mesh position={[-t / 2, -slab / 2, -t / 2]} material={materials} receiveShadow>
      <boxGeometry args={[w + t, slab, d + t]} />
    </mesh>
  )
}

export function Walls() {
  const { w, d, wallH: h, wallT: t, sill, head } = ROOM
  const pieces = useMemo(() => {
    const list = []
    // the back wall, cut at the top and at its right end
    list.push({ position: [-t / 2, h / 2, -d / 2 - t / 2], size: [w + t, h, t], cut: [FACE.top, FACE.right] })
    // the left wall: one piece below the windows, one above, and the piers between them
    const x = -w / 2 - t / 2
    list.push({ position: [x, sill / 2, 0], size: [t, sill, d], cut: [FACE.front] })
    list.push({ position: [x, (head + h) / 2, 0], size: [t, h - head, d], cut: [FACE.top, FACE.front] })
    let z = -d / 2
    for (const [z0, z1] of [...WINDOWS.map((win) => [win.z - win.w / 2, win.z + win.w / 2]), [d / 2, d / 2]]) {
      if (z0 > z) list.push({ position: [x, (sill + head) / 2, (z + z0) / 2], size: [t, head - sill, z0 - z], cut: z0 === d / 2 ? [FACE.front] : [] })
      z = z1
    }
    // a deep concrete ledge under each window, wide enough to sit on
    for (const win of WINDOWS) list.push({ position: [-w / 2 + 0.12, sill - 0.05, win.z], size: [0.24, 0.1, win.w + 0.3] })
    return list
  }, [w, d, h, t, sill, head])

  return (
    <group>
      {pieces.map((p, i) => (
        <Concrete key={i} {...p} />
      ))}
      {WINDOWS.map((win) => (
        <Window key={win.z} win={win} />
      ))}
      <Coping />
    </group>
  )
}

// A pale band along the top of both walls, a little wider than the wall, as on the towers in Monument Valley.
function Coping() {
  const { w, d, wallH: h, wallT: t } = ROOM
  const k = 0.12 // how far it sticks out on each side
  const bands = [
    { position: [-t / 2, h + 0.1, -d / 2 - t / 2], size: [w + t + 2 * k, 0.2, t + 2 * k] },
    { position: [-w / 2 - t / 2, h + 0.1, 0], size: [t + 2 * k, 0.2, d] },
  ]
  return bands.map((b, i) => (
    <mesh key={i} position={b.position} castShadow>
      <boxGeometry args={b.size} />
      <meshStandardMaterial color={TRIM} roughness={1} />
    </mesh>
  ))
}

// Glass in a slim steel frame, with a mullion and a transom that throw shadows into the room.
function Window({ win }) {
  const { w, wallT: t, sill, head } = ROOM
  const x = -w / 2 - t / 2
  const hgt = head - sill
  const yc = (sill + head) / 2
  const bars = [
    [0, head - 0.03, 0, 0.08, 0.06, win.w],
    [0, sill + 0.03, 0, 0.08, 0.06, win.w],
    [0, yc, -win.w / 2 + 0.03, 0.08, hgt, 0.06],
    [0, yc, win.w / 2 - 0.03, 0.08, hgt, 0.06],
    [0, yc, 0, 0.06, hgt, 0.05],
    [0, sill + hgt * 0.74, 0, 0.06, 0.05, win.w],
  ]
  return (
    <group position={[x, 0, win.z]}>
      <mesh position={[0, yc, 0]} rotation={[0, Math.PI / 2, 0]} raycast={noRaycast}>
        <planeGeometry args={[win.w, hgt]} />
        <meshBasicMaterial color={GLASS} transparent opacity={0.6} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {bars.map(([bx, by, bz, sx, sy, sz], i) => (
        <mesh key={i} position={[bx, by, bz]} castShadow>
          <boxGeometry args={[sx, sy, sz]} />
          <meshStandardMaterial color={STEEL} />
        </mesh>
      ))}
    </group>
  )
}

// Soft beams of sunlight from each window down to the floor, in one flat colour.
export function SunBeams() {
  const geometry = useMemo(() => {
    const { w, sill, head } = ROOM
    const [dx, dy, dz] = SUN_DIR
    const x = -w / 2
    // where a ray of sun through point p lands on the floor
    const onFloor = ([px, py, pz]) => {
      const k = py / -dy
      return [px + dx * k, 0.02, pz + dz * k]
    }
    const pos = []
    const quad = (a, b) => pos.push(...a, ...b, ...onFloor(b), ...a, ...onFloor(b), ...onFloor(a))
    for (const win of WINDOWS) {
      const z0 = win.z - win.w / 2
      const z1 = win.z + win.w / 2
      quad([x, head, z0], [x, head, z1])
      quad([x, sill, z0], [x, head, z0])
      quad([x, sill, z1], [x, head, z1])
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    return g
  }, [])
  return (
    <mesh geometry={geometry} raycast={noRaycast} renderOrder={10}>
      <meshBasicMaterial color={SUN} transparent opacity={0.12} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  )
}

// An invisible roof. It is never drawn, but it throws shade, so the sun only comes in through the windows.
export function ShadowRoof() {
  const { w, d, wallH: h, wallT: t } = ROOM
  const x0 = -w / 2 - t
  const z0 = -d / 2 - t
  const x1 = w / 2 + 3
  const z1 = d / 2 + 3
  return (
    <mesh position={[(x0 + x1) / 2, h + 0.1, (z0 + z1) / 2]} castShadow raycast={noRaycast}>
      <boxGeometry args={[x1 - x0, 0.2, z1 - z0]} />
      <meshBasicMaterial colorWrite={false} depthWrite={false} />
    </mesh>
  )
}
