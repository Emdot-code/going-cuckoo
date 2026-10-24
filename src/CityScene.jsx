// The 3D city, seen as a true isometric drawing: a square of pale spots floating in the sunset,
// each with a plain stone house (or a tree, when the spot is empty), and the demon's clock tower
// in the middle, with its digital display and a roof that opens like a lid.
// The residents are cubes, spheres, cones and pyramids living on the roofs: on their own roof
// they rest, on anyone else's they keep bouncing.
// The sun sinks and the light fades a little every hour; at 18:00 it is night.

import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CELL, CITY_SIZE, COLOUR_BY_ID, GRID, PLOTS, RESIDENT_BY_ID, STAGES, TOWER, areaOf, isHidden, isOpen, isTower, toWorld } from './city.js'
import { TALK_SECONDS, city, duskOf, isHome, sunOf, tickCity } from './cityGame.js'
import { topOf } from './town.js'
import { anchors, view } from './anchors.js'
import { Daemon } from './CuckooClock.jsx'
import { Shape } from './BuildingShape.jsx'
import { shopSignTexture } from './textures.js'
import {
  CLOCK_GREEN,
  FLOOR,
  GREENS,
  GRID_LINE,
  GROUND_LIGHT,
  INK,
  MINT,
  NIGHT_GROUND,
  NIGHT_SKY,
  OAK,
  PLOT_PAD,
  POCHE,
  RED,
  SKY_LIGHT,
  SUN,
  SUNSET_SUN,
  TOWER_SLITS,
  TOWER_STONE,
  PAPER,
  WINDOW_LIT,
} from './palette.js'

// The tower: a slim shaft with a wide clock head on top, so the head stands clear above the
// houses behind it. The display is on its front left wall, the law is carved into its front right
// wall, and the lid sits on top.
const HEAD = { w: 3.4, y: TOWER.h, h: 3.4 }
const TOP = HEAD.y + HEAD.h // where the lid sits
// The spots on the tower where the page pins the display, the demon's speech bubble and its z z z.
export const TOWER_SPOTS = {
  display: [0, HEAD.y + HEAD.h / 2, HEAD.w / 2],
  inscription: [HEAD.w / 2, HEAD.y + HEAD.h / 2, 0],
  bubble: [0.4, TOP + 1.9, 0.4],
  sleep: [0, TOP + 2.8, 0],
}
// If you're not home at sunset, you end up out here, on a lonely tile off the left corner (where
// there is room beside the city, so the city can stay big on screen).
const STRANDED = { x: -CITY_SIZE / 2 - 2.2, z: CITY_SIZE / 2 + 2.2 }
// The demon is drawn 8 times its size in the cuckoo clock, so its head is about a metre wide.
const DEMON_SCALE = 8
// The top of a tree, where whoever lands on it stands.
export const TREE_TOP = 2.1

const clamp01 = (x) => Math.min(1, Math.max(0, x))
const ease = (x) => x * x * (3 - 2 * x)
// How dark it is: a little more every hour, and fully at night.
const darkness = () => (city.phase === 'night' ? 1 : duskOf(city.minutes))

// --- the camera ---

// The directions across and up the screen, for a camera looking from the front right, up high.
const RIGHT = new THREE.Vector3(1, 0, -1).normalize()
const UP = new THREE.Vector3(-1, 2, -1).normalize()
// Room left for the little panel along the top, and around the edges, in pixels.
const MARGIN = { top: 62, bottom: 16, side: 16 }

// How far the camera zooms in and where it looks, so the whole city as it is now (with the tower,
// and once it has fully grown, the lonely tile out front) fills the window.
function fitOf(size, stage) {
  const a = areaOf(stage)
  const points = [
    ...[-1, 1].flatMap((sx) =>
      [-1, 1].flatMap((sz) => {
        const x = a.x + sx * (a.w / 2 + 0.4)
        const z = a.z + sz * (a.d / 2 + 0.4)
        return [new THREE.Vector3(x, 0, z), new THREE.Vector3(x, -1.2, z)]
      }),
    ),
    new THREE.Vector3(0, TOP + 3.4, 0),
  ]
  if (stage === STAGES.length - 1) points.push(new THREE.Vector3(STRANDED.x + 1, -0.6, STRANDED.z + 1))
  const xs = points.map((p) => p.dot(RIGHT))
  const ys = points.map((p) => p.dot(UP))
  const w = Math.max(...xs) - Math.min(...xs)
  const tall = Math.max(...ys) - Math.min(...ys)
  const zoom = Math.min((size.width - MARGIN.side * 2) / w, (size.height - MARGIN.top - MARGIN.bottom) / tall)
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2
  // (shifted so the city sits a little lower, below the top panel)
  const cy = (Math.max(...ys) + Math.min(...ys)) / 2 + (MARGIN.top - MARGIN.bottom) / 2 / zoom
  return { zoom, target: RIGHT.clone().multiplyScalar(cx).add(UP.clone().multiplyScalar(cy)) }
}

// The camera glides out smoothly whenever the city grows.
const BACK = new THREE.Vector3(40, 40, 40)
function FitCamera() {
  const fit = useRef(null)
  useFrame(({ camera, size }, dt) => {
    const want = fitOf(size, city.stage)
    const f = (fit.current ??= { zoom: want.zoom, target: want.target.clone(), u: '' })
    const k = 1 - Math.exp(-dt * 2)
    f.zoom += (want.zoom - f.zoom) * k
    f.target.lerp(want.target, k)
    camera.zoom = f.zoom
    camera.position.copy(f.target).add(BACK)
    camera.lookAt(f.target)
    camera.updateProjectionMatrix()
    // how many pixels a metre takes on screen, for the panels pinned to the city (anchors.js)
    const u = `${f.zoom.toFixed(2)}px`
    if (u !== f.u) document.documentElement.style.setProperty('--u', (f.u = u))
  })
  return null
}

// --- light ---

// Soft sunset light everywhere, plus the sun, which comes from the left of the screen and sinks
// lower every hour, turning from apricot to coral, while everything slowly gets darker.
const DAY = { sky: new THREE.Color(SKY_LIGHT), ground: new THREE.Color(GROUND_LIGHT), sun: new THREE.Color(SUN) }
const NIGHT = { sky: new THREE.Color(NIGHT_SKY), ground: new THREE.Color(NIGHT_GROUND), sun: new THREE.Color(SUNSET_SUN) }
const FROM_SUN = new THREE.Vector3(-1, 0, 0.55).normalize()

function Lights() {
  const sky = useRef()
  const light = useRef()
  useFrame(() => {
    const sun = sunOf(city.minutes)
    const dark = darkness()
    const height = THREE.MathUtils.degToRad(58 - sun * 50)
    light.current.position.copy(FROM_SUN).multiplyScalar(Math.cos(height) * 45).setY(Math.sin(height) * 45)
    light.current.color.lerpColors(DAY.sun, NIGHT.sun, sun)
    light.current.intensity = 1.7 * (1 - dark * 0.85)
    sky.current.color.lerpColors(DAY.sky, NIGHT.sky, dark)
    sky.current.groundColor.lerpColors(DAY.ground, NIGHT.ground, dark)
    sky.current.intensity = 1.6 - dark * 0.5
  })
  return (
    <>
      <hemisphereLight ref={sky} args={[SKY_LIGHT, GROUND_LIGHT, 1.6]} />
      <directionalLight
        ref={light}
        color={SUN}
        intensity={1.7}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-camera-far={120}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
    </>
  )
}

// --- the ground ---

// A thick slab with mauve cut sides, like a section drawing, with thin joints showing the grid,
// a pale raised pad for every spot, and lavender paving round the tower and behind it. As the
// city grows, the slab stretches and the new pads rise into place.
const CELLS = []
for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) CELLS.push({ c, r, ...toWorld(c, r), plaza: isHidden(c, r) || isTower(c, r) })

function Ground() {
  const pad = useMemo(() => new THREE.BoxGeometry(CELL - 0.22, 0.12, CELL - 0.22), [])
  const slab = useRef()
  const pads = useRef([])
  const thick = 1.2
  const start = areaOf(city.stage)
  useFrame((_, dt) => {
    const a = areaOf(city.stage)
    const s = slab.current
    const k = 1 - Math.exp(-dt * 3)
    s.scale.x += (a.w + 0.3 - s.scale.x) * k
    s.scale.z += (a.d + 0.3 - s.scale.z) * k
    s.position.x += (a.x - s.position.x) * k
    s.position.z += (a.z - s.position.z) * k
    CELLS.forEach((cell, i) => {
      const m = pads.current[i]
      if (!m) return
      const v = THREE.MathUtils.damp(m.scale.x, isOpen(city.stage, cell.c, cell.r) ? 1 : 0.001, 4, dt)
      m.scale.setScalar(v)
      m.visible = v > 0.01
    })
  })
  return (
    <group>
      <mesh ref={slab} position={[start.x, -thick / 2, start.z]} scale={[start.w + 0.3, 1, start.d + 0.3]} receiveShadow>
        <boxGeometry args={[1, thick, 1]} />
        {/* the six faces: right, left, top, bottom, front, back */}
        {[POCHE, POCHE, GRID_LINE, POCHE, POCHE, POCHE].map((colour, i) => (
          <meshStandardMaterial key={i} attach={`material-${i}`} color={colour} roughness={0.9} />
        ))}
      </mesh>
      {CELLS.map((cell, i) => (
        <mesh
          key={i}
          ref={(m) => (pads.current[i] = m)}
          geometry={pad}
          position={[cell.x, 0.06, cell.z]}
          scale={isOpen(city.stage, cell.c, cell.r) ? 1 : 0.001}
          receiveShadow
        >
          <meshStandardMaterial color={cell.plaza ? TOWER_STONE : PLOT_PAD} roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

// A tree on every empty spot, with three little birds in it. When someone lands on it, the birds
// fly up and circle round, furious, for a few seconds.
const BIRD_ANGRY_SECONDS = 3.5

function Tree({ index }) {
  const p = PLOTS[index]
  const tree = useRef()
  const birds = useRef([])
  const angry = useRef({ seen: 0, t: 99 })
  useFrame(({ clock }, dt) => {
    const empty = isOpen(city.stage, p.c, p.r) && index !== city.store && !city.houses.some((h) => h.plot === index)
    const s = THREE.MathUtils.damp(tree.current.scale.x, empty ? 1 : 0.001, 6, dt)
    tree.current.scale.setScalar(s)
    tree.current.visible = s > 0.01
    const a = angry.current
    if ((city.birds[index] ?? 0) !== a.seen) {
      a.seen = city.birds[index]
      a.t = 0
    }
    a.t += dt
    const fly = clamp01(Math.min(a.t / 0.3, (BIRD_ANGRY_SECONDS - a.t) / 0.6))
    const t = clock.elapsedTime
    birds.current.forEach((b, i) => {
      if (!b) return
      const sit = (i / 3) * Math.PI * 2 + 0.6
      const round = t * 5 + (i / 3) * Math.PI * 2
      const angle = sit + (round - sit) * fly
      const r = 0.55 + fly * 0.5
      b.position.set(Math.cos(angle) * r, 1.75 + fly * (0.8 + Math.sin(t * 14 + i) * 0.15), Math.sin(angle) * r)
      b.rotation.set(0, -angle, fly * Math.sin(t * 30 + i) * 0.6)
    })
  })
  return (
    <group ref={tree} position={[p.x, 0.12, p.z]} scale={isOpen(city.stage, p.c, p.r) ? 1 : 0.001}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 0.9, 8]} />
        <meshStandardMaterial color={OAK} />
      </mesh>
      <mesh position={[0, 1.3, 0]} castShadow>
        <sphereGeometry args={[0.72, 24, 16]} />
        <meshStandardMaterial color={GREENS[index % GREENS.length]} roughness={0.8} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <group key={i} ref={(b) => (birds.current[i] = b)}>
          <mesh>
            <sphereGeometry args={[0.1, 12, 8]} />
            <meshStandardMaterial color={INK} roughness={0.6} />
          </mesh>
          <mesh position={[0.11, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.04, 0.1, 6]} />
            <meshStandardMaterial color={SUNSET_SUN} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// --- the tower and its demon ---

// Whether the demon is out: for a few seconds after every law.
const demonOut = () => city.phase === 'running' && city.lawCount > 0 && city.demonT < TALK_SECONDS

function ClockTower() {
  const lid = useRef()
  const demon = useRef()
  const eyes = useRef([])
  const mouth = useRef()
  const hat = useRef()
  const arm = useRef()
  const open = useRef(0)

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    const awake = demonOut()
    const night = city.phase === 'night'
    // the lid swings open when the demon wakes, and stays ajar while it sleeps at night
    open.current = THREE.MathUtils.damp(open.current, awake ? 1 : night ? 0.4 : 0, 3.5, dt)
    lid.current.rotation.z = ease(open.current) * 1.9
    // the demon pops up once the lid is half open
    const pop = clamp01((open.current - 0.3) / 0.7)
    const d = demon.current
    d.visible = pop > 0.02
    // (it sits inside a group scaled DEMON_SCALE times, so its height is in that group's units)
    d.position.y = (TOP - 0.8 + ease(pop) * 1.9 + (awake ? Math.sin(t * 6) * 0.06 : 0)) / DEMON_SCALE
    d.rotation.z = awake ? Math.sin(t * 2.3) * 0.12 : 0.25
    d.getObjectByName('spring').visible = false
    d.getObjectByName('head').rotation.y = awake ? Math.sin(t * 1.4) * 0.5 : 0
    // eyes wide open (with a blink now and then) while awake, shut at night
    const blink = t % 3.2 < 0.12
    for (const e of eyes.current) if (e) e.scale.y = night ? 0.1 : blink ? 0.15 : 1
    // its mouth moves while it talks
    const talking = awake && city.demonT > 0.9
    mouth.current.scale.set(1.2, talking ? 0.4 + Math.abs(Math.sin(t * 13)) * 1.4 : 0.3, 1)
  })

  const { w, h } = TOWER
  return (
    <group>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, w]} />
        <meshStandardMaterial color={TOWER_STONE} roughness={0.8} />
      </mesh>
      {/* tall slit windows and a door */}
      {[2, 4.4, 6.8].map((y) => (
        <mesh key={y} position={[w / 2 + 0.01, y, 0]}>
          <boxGeometry args={[0.02, 1.4, 0.24]} />
          <meshStandardMaterial color={TOWER_SLITS} />
        </mesh>
      ))}
      <mesh position={[0, 0.8, w / 2 + 0.01]}>
        <boxGeometry args={[0.7, 1.6, 0.02]} />
        <meshStandardMaterial color={TOWER_SLITS} />
      </mesh>
      {/* the clock head: wider than the shaft */}
      <mesh position={[0, HEAD.y + HEAD.h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[HEAD.w, HEAD.h, HEAD.w]} />
        <meshStandardMaterial color={TOWER_STONE} roughness={0.8} />
      </mesh>
      <mesh position={[0, HEAD.y - 0.1, 0]} castShadow>
        <boxGeometry args={[HEAD.w + 0.25, 0.2, HEAD.w + 0.25]} />
        <meshStandardMaterial color={TOWER_STONE} roughness={0.8} />
      </mesh>
      {/* the lid, hinged along its back left edge */}
      <group ref={lid} position={[-HEAD.w / 2 - 0.15, TOP, 0]}>
        <group position={[HEAD.w / 2 + 0.15, 0, 0]}>
          <mesh position={[0, 0.15, 0]} castShadow>
            <boxGeometry args={[HEAD.w + 0.3, 0.3, HEAD.w + 0.3]} />
            <meshStandardMaterial color={CLOCK_GREEN} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.3 + 0.6, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[(HEAD.w + 0.3) * Math.SQRT1_2, 1.2, 4]} />
            <meshStandardMaterial color={CLOCK_GREEN} roughness={0.6} flatShading />
          </mesh>
        </group>
      </group>
      {/* the demon, turned to face you */}
      <group rotation={[0, Math.PI / 4, 0]}>
        <group scale={DEMON_SCALE}>
          <Daemon daemonRef={demon} eyeRefs={eyes} mouthRef={mouth} hatRef={hat} armRef={arm} />
        </group>
      </group>
    </group>
  )
}

// --- the houses ---

// Where the top of every house is right now, as they glide about: the residents stand on these.
const roofs = []
// The top of a house of this design, from the ground.
export const houseTop = (h) => 0.12 + topOf(h.design, h.floors)

// One plain stone house, gliding to whatever spot it has been given (and rising a little while
// it travels, so it hops over the others). Whoever stands on it rides along. A house whose owner
// hasn't arrived yet isn't there; when they arrive, it drops in from the sky.
const DROP = 16 // metres above its spot that a new house drops in from

function House({ index }) {
  const house = city.houses[index]
  const outer = useRef()
  const pose = useRef(null)
  const seen = useRef(false) // whether this house has been drawn before

  useFrame((_, dt) => {
    const arrived = house.plot !== null
    outer.current.visible = arrived
    if (!arrived) {
      roofs[index] = null
      seen.current = true
      return
    }
    const plot = PLOTS[house.plot]
    // (the houses already in town when the city is first drawn are simply there)
    const p = (pose.current ??= { x: plot.x, z: plot.z, drop: seen.current ? DROP : 0 })
    seen.current = true
    const k = 1 - Math.exp(-dt * 2.4)
    p.x += (plot.x - p.x) * k
    p.z += (plot.z - p.z) * k
    p.drop = THREE.MathUtils.damp(p.drop, 0, 3, dt)
    const away = Math.hypot(plot.x - p.x, plot.z - p.z)
    const y = 0.12 + Math.min(away, 5) * 0.6 + p.drop
    outer.current.position.set(p.x, y, p.z)
    roofs[index] = { x: p.x, y: y + topOf(house.design, house.floors), z: p.z }
  })

  return (
    <group ref={outer}>
      <Shape shape={house.design} floors={house.floors} colour={house.stone} />
    </group>
  )
}

// --- the residents ---

const SIZE = 1.3 // the residents are drawn a little bigger than life, so you can't miss them
const BODY = { cube: 0.275, sphere: 0.32, cone: 0.375, pyramid: 0.3 } // half their height
// The colours of your ring: home, and not home.
const MINT_COLOUR = new THREE.Color(MINT)
const RED_COLOUR = new THREE.Color(RED)

function Body({ shape, colour }) {
  return (
    <mesh castShadow rotation={shape === 'pyramid' ? [0, Math.PI / 4, 0] : [0, 0, 0]}>
      {shape === 'cube' && <boxGeometry args={[0.55, 0.55, 0.55]} />}
      {shape === 'sphere' && <sphereGeometry args={[0.32, 28, 20]} />}
      {shape === 'cone' && <coneGeometry args={[0.32, 0.75, 32]} />}
      {shape === 'pyramid' && <coneGeometry args={[0.44, 0.6, 4]} />}
      <meshStandardMaterial color={colour} roughness={0.5} flatShading={shape === 'pyramid'} />
    </mesh>
  )
}

// Where a walker's feet go: on top of its house, or of its tree.
function standOn(w, v) {
  if (w.house !== null) {
    const roof = roofs[w.house]
    return roof ? v.set(roof.x, roof.y, roof.z) : null
  }
  if (w.tree === city.store && storeRoof.y) return v.set(storeRoof.x, storeRoof.y, storeRoof.z)
  const p = PLOTS[w.tree]
  return v.set(p.x, 0.12 + TREE_TOP, p.z)
}

// One resident, on a roof. It hops from roof to roof in an arc, bounces on any roof that isn't
// its own, and rests on its own. You are a little bigger, with a ring around your feet: mint
// when you're home, coral red when you're not.
function Walker({ index }) {
  const w = city.walkers[index]
  const r = RESIDENT_BY_ID[w.id]
  const group = useRef()
  const ring = useRef()
  const feet = useMemo(() => new THREE.Vector3(), [])
  const target = useMemo(() => new THREE.Vector3(), [])
  const from = useRef({ hops: -1, at: new THREE.Vector3() })

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    // not moved in yet: nowhere to be seen
    group.current.visible = ring.current.visible = !w.away
    if (w.away) return
    // (worked out every frame, because you only pick your shape once the city is already here)
    const you = w.id === city.player && city.phase !== 'select'
    const night = city.phase === 'night'
    const stranded = you && night && !city.home
    if (stranded) target.set(STRANDED.x, 0.06, STRANDED.z)
    else if (!standOn(w, target)) return
    // others standing on the same roof stand side by side
    const sharing = city.walkers.filter((o) => o.t >= 1 && o.house === w.house && o.tree === w.tree)
    if (!stranded && w.t >= 1 && sharing.length > 1) {
      const angle = (sharing.indexOf(w) / sharing.length) * Math.PI * 2
      target.x += Math.cos(angle) * 0.45
      target.z += Math.sin(angle) * 0.45
    }
    const f = from.current
    if (f.hops === -1) feet.copy(target) // the first time, it starts right there
    if (f.hops !== w.hops) {
      f.hops = w.hops
      f.at.copy(feet)
    }
    if (stranded) {
      // flung out onto the lonely tile
      feet.lerp(target, 1 - Math.exp(-dt * 2))
    } else if (w.t < 1 && !w.bump) {
      // an arc from where it was to where it lands
      feet.lerpVectors(f.at, target, w.t)
      feet.y += (1 + f.at.distanceTo(target) * 0.15) * 4 * w.t * (1 - w.t)
    } else {
      feet.copy(target)
      // a hop towards the tower or the edge of town, and straight back
      if (w.bump && w.t < 1) {
        const k = Math.sin(Math.PI * w.t)
        feet.x += w.bump.dc * k * 0.7
        feet.z += w.bump.dr * k * 0.7
        feet.y += k * 0.5
      }
    }
    // not home: it keeps bouncing up and down (but not at night, when everyone sleeps)
    const restless = w.t >= 1 && !isHome(w) && !night && city.phase !== 'select'
    const bounce = restless ? Math.abs(Math.sin(t * 7 + index)) * 0.55 : 0
    const s = SIZE * (you ? 1.15 : 1)
    // asleep at night: a little squashed
    const squash = night ? 0.8 : 1
    group.current.scale.set(s, s * squash, s)
    group.current.position.set(feet.x, feet.y + bounce + BODY[r.shape] * s * squash, feet.z)
    // what you carry floats just above your head (the page pins the grocery there)
    if (you) carryPoint.splice(0, 3, feet.x, feet.y + bounce + BODY[r.shape] * s * 2 + 0.7, feet.z)
    // everyone has a ring, but only yours is big enough to see (the others are always ready,
    // so nothing new has to be prepared when you pick your shape)
    ring.current.position.set(feet.x, feet.y + 0.03, feet.z)
    ring.current.scale.setScalar(you ? 1 + 0.08 * Math.sin(t * 4) : 0.0001)
    // mint while you're home, coral red while you're not (it fades from one to the other)
    ring.current.material.color.lerp(isHome(w) ? MINT_COLOUR : RED_COLOUR, 1 - Math.exp(-dt * 8))
  })

  return (
    <>
      <group ref={group}>
        <Body shape={r.shape} colour={COLOUR_BY_ID[r.colour].hex} />
      </group>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.62, 0.76, 48]} />
        <meshBasicMaterial color={MINT} side={THREE.DoubleSide} />
      </mesh>
    </>
  )
}

// --- the grocery shop ---

// Where the tip of the shop's roof is right now (whoever shops stands on it), and where the page
// pins the grocery you carry. They are changed in place, every frame.
const storeRoof = { x: 0, y: 0, z: 0 }
export const carryPoint = [0, 0, 0]
const SHOP = { w: 2.5, h: 1.7, roof: 1.2 } // its width, the height of its walls and of its roof
const SHOP_TOP = 0.12 + SHOP.h + SHOP.roof // the tip of its roof, from the ground
const ROOF_BANDS = 4 // the roof's stripes, red and white in turn
const ROOF_R = ((SHOP.w + 0.3) / 2) * Math.SQRT2 // from the roof's middle to its corners, at the eaves

// A pale shop with a pyramid roof in red and white stripes, glowing shop windows, striped
// awnings and a SHOP sign on its two front walls. When the city grows it glides out onto the new
// land, like a house.
function Store() {
  const sign = useMemo(shopSignTexture, [])
  const outer = useRef()
  const pose = useRef(null)
  useFrame((_, dt) => {
    const plot = PLOTS[city.store]
    const p = (pose.current ??= { x: plot.x, z: plot.z })
    const k = 1 - Math.exp(-dt * 2.4)
    p.x += (plot.x - p.x) * k
    p.z += (plot.z - p.z) * k
    const y = 0.12 + Math.min(Math.hypot(plot.x - p.x, plot.z - p.z), 5) * 0.6
    outer.current.position.set(p.x, y, p.z)
    Object.assign(storeRoof, { x: p.x, y: y - 0.12 + SHOP_TOP, z: p.z })
  })
  const stripes = [0, 1, 2, 3, 4]
  const stripe = SHOP.w / stripes.length
  return (
    <group ref={outer}>
      <mesh position={[0, SHOP.h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[SHOP.w, SHOP.h, SHOP.w]} />
        <meshStandardMaterial color={PAPER} roughness={0.8} />
      </mesh>
      {/* the pyramid roof: four bands, each a four-sided slice of the pyramid, red and white in turn */}
      {Array.from({ length: ROOF_BANDS }, (_, i) => (
        <mesh key={i} position={[0, SHOP.h + (SHOP.roof * (i + 0.5)) / ROOF_BANDS, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <cylinderGeometry args={[ROOF_R * (1 - (i + 1) / ROOF_BANDS), ROOF_R * (1 - i / ROOF_BANDS), SHOP.roof / ROOF_BANDS, 4]} />
          <meshStandardMaterial color={i % 2 ? PAPER : RED} roughness={0.7} flatShading />
        </mesh>
      ))}
      {/* on each front wall (+x and +z): a big shop window, a striped awning above it, and the sign */}
      {[0, Math.PI / 2].map((turn) => (
        <group key={turn} rotation={[0, turn, 0]}>
          <mesh position={[0, 0.55, SHOP.w / 2 + 0.01]}>
            <boxGeometry args={[SHOP.w * 0.7, 0.7, 0.02]} />
            <meshStandardMaterial color={WINDOW_LIT} emissive={WINDOW_LIT} emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0, 1.44, SHOP.w / 2 + 0.03]}>
            <boxGeometry args={[1.5, 0.375, 0.04]} />
            {[RED, RED, RED, RED, null, RED].map((colour, k) =>
              colour ? <meshStandardMaterial key={k} attach={`material-${k}`} color={colour} /> : <meshStandardMaterial key={k} attach={`material-${k}`} map={sign} roughness={0.8} />,
            )}
          </mesh>
          {stripes.map((i) => (
            <mesh key={i} position={[-SHOP.w / 2 + stripe * (i + 0.5), 1.08, SHOP.w / 2 + 0.25]} rotation={[0.5, 0, 0]} castShadow>
              <boxGeometry args={[stripe, 0.05, 0.6]} />
              <meshStandardMaterial color={i % 2 ? PAPER : RED} roughness={0.7} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

// The lonely tile off the front corner of the city, with a street lamp: only there at night, for
// whoever didn't make it home.
function StrandedTile() {
  const group = useRef()
  useFrame((_, dt) => {
    const show = city.phase === 'night' && !city.home
    const s = THREE.MathUtils.damp(group.current.scale.x, show ? 1 : 0.001, 4, dt)
    group.current.scale.setScalar(s)
    group.current.visible = s > 0.01
  })
  return (
    <group ref={group} position={[STRANDED.x, 0, STRANDED.z]} scale={0.001}>
      <mesh position={[0, -0.3, 0]} receiveShadow>
        <boxGeometry args={[1.6, 0.6, 1.6]} />
        {[POCHE, POCHE, FLOOR, POCHE, POCHE, POCHE].map((colour, i) => (
          <meshStandardMaterial key={i} attach={`material-${i}`} color={colour} roughness={0.9} />
        ))}
      </mesh>
      <mesh position={[-0.55, 0.8, -0.55]}>
        <cylinderGeometry args={[0.03, 0.04, 1.6, 8]} />
        <meshStandardMaterial color={TOWER_SLITS} />
      </mesh>
      <mesh position={[-0.55, 1.65, -0.55]}>
        <sphereGeometry args={[0.12, 16, 12]} />
        <meshStandardMaterial color={WINDOW_LIT} emissive={WINDOW_LIT} emissiveIntensity={1.4} />
      </mesh>
    </group>
  )
}

// Moves every page element pinned to the city (see anchors.js) to where its point is on screen.
function PlaceAnchors() {
  const v = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ camera, size }) => {
    view.camera = camera
    view.size = size
    for (const a of anchors) {
      if (!a.el.isConnected) {
        anchors.delete(a)
        continue
      }
      v.set(...a.point).project(camera)
      a.el.style.transform = `translate(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px)`
      a.el.style.visibility = 'visible'
    }
  })
  return null
}

// Moves the day forward every frame.
function Ticker() {
  useFrame((_, dt) => tickCity(Math.min(dt, 0.05)))
  return null
}

export default function CityScene() {
  return (
    <Canvas orthographic shadows flat dpr={[1, 2]} camera={{ position: [40, 40, 40], zoom: 30, near: 0.1, far: 300 }}>
      <FitCamera />
      <Lights />
      <Ticker />
      <Ground />
      {PLOTS.map((_, i) => (
        <Tree key={i} index={i} />
      ))}
      <ClockTower />
      {city.houses.map((h, i) => (
        <House key={h.id} index={i} />
      ))}
      {city.walkers.map((w, i) => (
        <Walker key={w.id} index={i} />
      ))}
      <Store />
      <StrandedTile />
      <PlaceAnchors />
    </Canvas>
  )
}
