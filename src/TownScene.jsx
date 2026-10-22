// The 3D town, seen as a true isometric drawing like the studio: a square of plots floating in the
// sunset, the demon's clock tower in the middle and the houses around it, in soft stone colours
// that say nothing about whose they are. The residents are spheres sitting on the roofs.
// Every building glides smoothly to whatever the demon's latest rule made of it: a new plot, a
// new turn, floating, upside down or a new shape (it shrinks away and pops up again).
// From 17:00 the sun sets and the light fades; at 18:00 it is night.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { OWNER_BY_ID, PLOT, PLOTS, SHAPE_NAME, TOWER, TOWN_SIZE, topOf } from './town.js'
import { canHopTo, duskOf, hopTo, isHome, sneeze, sphereOf, tickTown, town, useTown } from './townGame.js'
import { SUN_DIR } from './studio.js'
import CuckooClock from './CuckooClock.jsx'
import { Shape } from './BuildingShape.jsx'
import {
  CLOCK_GREEN,
  FLOOR as FLOOR_COLOUR,
  FLOOR_ALT,
  GROUND_LIGHT,
  MINT,
  NIGHT_GROUND,
  NIGHT_SKY,
  POCHE,
  RED,
  SKY_LIGHT,
  SUN,
  TOWER_SLITS,
  TOWER_STONE,
} from './palette.js'

// The height of the panels along the bottom of the page, in pixels: the town is fitted above them.
const BOTTOM_PANELS = 120

// Zooms so the whole town and its tower fit the window above the bottom panels, also when the
// window is resized.
function FitCamera() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  useEffect(() => {
    const across = TOWN_SIZE * 2
    const wide = across * Math.SQRT1_2 * 1.1
    const tall = across * 0.408 + (TOWER.h + 2.5) * 0.816
    camera.zoom = Math.min(size.width / wide, (size.height - BOTTOM_PANELS) / tall)
    // look a little below the town, so on screen it sits higher, clear of the bottom panels
    camera.position.set(30, 30, 30)
    camera.lookAt(0, 2.5, 0)
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion)
    const shift = up.multiplyScalar(-BOTTOM_PANELS / 2 / camera.zoom)
    camera.position.add(shift)
    camera.lookAt(new THREE.Vector3(0, 2.5, 0).add(shift))
    camera.updateProjectionMatrix()
  }, [camera, size])
  return null
}

// Soft sunset light everywhere (warm from above, lavender from below), plus the low sun. As the
// sun sets, its light fades away and the sky light turns a deep night blue.
const DAY = { sky: new THREE.Color(SKY_LIGHT), ground: new THREE.Color(GROUND_LIGHT) }
const NIGHT = { sky: new THREE.Color(NIGHT_SKY), ground: new THREE.Color(NIGHT_GROUND) }

function Lights() {
  const sun = useMemo(() => new THREE.Vector3(...SUN_DIR).normalize().multiplyScalar(-30), [])
  const sky = useRef()
  const light = useRef()
  useFrame(() => {
    const dusk = duskOf(town.minutes)
    sky.current.color.lerpColors(DAY.sky, NIGHT.sky, dusk)
    sky.current.groundColor.lerpColors(DAY.ground, NIGHT.ground, dusk)
    sky.current.intensity = 1.7 - dusk * 0.5
    light.current.intensity = 1.6 * (1 - dusk)
  })
  return (
    <>
      <hemisphereLight ref={sky} args={[SKY_LIGHT, GROUND_LIGHT, 1.7]} />
      <directionalLight
        ref={light}
        position={sun.toArray()}
        color={SUN}
        intensity={1.6}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-far={70}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
    </>
  )
}

// The ground the town stands on: a thick slab with a sand top and mauve cut sides, like a section
// drawing, and a slightly darker pad for every plot.
function Ground() {
  const slab = 1.2
  return (
    <group>
      <mesh position={[0, -slab / 2, 0]} receiveShadow>
        <boxGeometry args={[TOWN_SIZE + 0.6, slab, TOWN_SIZE + 0.6]} />
        {/* the six faces: right, left, top, bottom, front, back */}
        <meshStandardMaterial attach="material-0" color={POCHE} roughness={0.9} />
        <meshStandardMaterial attach="material-1" color={POCHE} roughness={0.9} />
        <meshStandardMaterial attach="material-2" color={FLOOR_COLOUR} roughness={0.9} />
        <meshStandardMaterial attach="material-3" color={POCHE} roughness={0.9} />
        <meshStandardMaterial attach="material-4" color={POCHE} roughness={0.9} />
        <meshStandardMaterial attach="material-5" color={POCHE} roughness={0.9} />
      </mesh>
      {PLOTS.map((p, i) => (
        <mesh key={i} position={[p.x, 0.02, p.z]} receiveShadow>
          <boxGeometry args={[PLOT - 0.5, 0.04, PLOT - 0.5]} />
          <meshStandardMaterial color={FLOOR_ALT} roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

// The demon's tower: a tall pale shaft with slit windows, a sage pyramid roof, a red flag, and the
// very same cuckoo clock as in the studio on its front.
function ClockTower() {
  const { w, h, clockY, clockScale } = TOWER
  return (
    <group>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, w]} />
        <meshStandardMaterial color={TOWER_STONE} roughness={0.8} />
      </mesh>
      {/* a thin cornice and the pyramid roof */}
      <mesh position={[0, h + 0.12, 0]} castShadow>
        <boxGeometry args={[w + 0.4, 0.24, w + 0.4]} />
        <meshStandardMaterial color={TOWER_STONE} roughness={0.8} />
      </mesh>
      <mesh position={[0, h + 0.24 + 1.1, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[(w + 0.4) * Math.SQRT1_2, 2.2, 4]} />
        <meshStandardMaterial color={CLOCK_GREEN} roughness={0.6} flatShading />
      </mesh>
      <mesh position={[0, h + 3, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.4, 6]} />
        <meshStandardMaterial color={TOWER_SLITS} />
      </mesh>
      <mesh position={[0.3, h + 3.45, 0]}>
        <boxGeometry args={[0.6, 0.4, 0.04]} />
        <meshStandardMaterial color={RED} />
      </mesh>
      {/* tall slit windows on the sunny side */}
      {[1.4, 3.6, 5.8].map((y) => (
        <mesh key={y} position={[w / 2 + 0.01, y, 0]}>
          <boxGeometry args={[0.02, 1.3, 0.22]} />
          <meshStandardMaterial color={TOWER_SLITS} />
        </mesh>
      ))}
      <mesh position={[0, 0.8, w / 2 + 0.01]}>
        <boxGeometry args={[0.7, 1.6, 0.02]} />
        <meshStandardMaterial color={TOWER_SLITS} />
      </mesh>
      <CuckooClock state={town} position={[0, clockY, w / 2 + 0.09 * clockScale]} scale={clockScale} />
    </group>
  )
}

const ease = (x) => x * x * (3 - 2 * x)
const OWNER_COLOUR = Object.fromEntries(Object.values(OWNER_BY_ID).map((o) => [o.id, new THREE.Color(o.colour)]))

// Where the middle of every roof is right now, as the buildings glide, float and flip; the spheres
// sit and land on these.
const roofs = []

// One building, gliding towards whatever town.buildings[index] says it should be.
function Building({ index, onHover }) {
  const start = town.buildings[index]
  const [shown, setShown] = useState({ shape: start.shape, floors: start.floors })
  const outer = useRef()
  const flipper = useRef()
  const body = useRef()
  const pose = useRef(null)

  useFrame(({ clock }, dt) => {
    const b = town.buildings[index]
    const plot = PLOTS[b.plot]
    const p = (pose.current ??= { x: plot.x, z: plot.z, lift: b.lift, rot: b.rot, flip: b.flip ? Math.PI : 0, size: 1 })
    const k = 1 - Math.exp(-dt * 2.2)
    p.x += (plot.x - p.x) * k
    p.z += (plot.z - p.z) * k
    p.lift += (b.lift - p.lift) * k
    p.rot += (b.rot - p.rot) * k
    p.flip += ((b.flip ? Math.PI : 0) - p.flip) * k

    // a new shape or height: shrink away, swap, and pop up again
    if (b.shape !== shown.shape || b.floors !== shown.floors) {
      p.size = Math.max(0, p.size - dt * 2.5)
      if (p.size === 0) setShown({ shape: b.shape, floors: b.floors })
    } else p.size = Math.min(1, p.size + dt * 2.5)

    const top = topOf(shown.shape, shown.floors)
    const size = Math.max(0.001, ease(p.size))
    // it rises while it travels to another plot, and floating ones bob gently
    const away = Math.hypot(plot.x - p.x, plot.z - p.z)
    const bob = b.lift > 0 ? Math.sin(clock.elapsedTime * 1.3 + index) * 0.12 : 0
    const y = p.lift + Math.min(away, 4) * 0.7 + bob
    outer.current.position.set(p.x, y, p.z)
    outer.current.rotation.y = p.rot
    // it flips around its middle, so an upside-down building takes the same space
    flipper.current.position.y = top / 2
    flipper.current.rotation.x = p.flip
    body.current.position.y = -top / 2
    body.current.scale.setScalar(size)
    // (an upside-down building shrinks from its roof, so its roof stays where it is)
    roofs[index] = { x: p.x, y: y + top * (b.flip ? 1 : size), z: p.z }
  })

  return (
    <group
      ref={outer}
      onPointerMove={(e) => {
        e.stopPropagation()
        onHover(index, e.nativeEvent.clientX, e.nativeEvent.clientY)
      }}
      onPointerOut={() => onHover(null)}
      onClick={(e) => {
        e.stopPropagation()
        hopTo(index)
      }}
    >
      <group ref={flipper}>
        <group ref={body}>
          <Shape shape={shown.shape} floors={shown.floors} colour={start.stone} />
        </group>
      </group>
    </group>
  )
}

const SPHERE = 0.3 // a sphere's radius; yours is a little bigger
const YOU = 0.36

// The residents: spheres sitting on roofs, hanging in the air while the demon moves the houses,
// flying when they are bounced out, hopping from roof to roof, and at night sleeping at home
// (glowing softly, like a lit window) or down in the street.
function Spheres() {
  const refs = useRef({})
  const halo = useRef()
  const pos = useMemo(() => Object.fromEntries(town.spheres.map((s) => [s.id, new THREE.Vector3()])), [])
  // where each sphere was when its latest jump began, and which jump that was
  const starts = useMemo(() => Object.fromEntries(town.spheres.map((s) => [s.id, { jumps: 0, at: new THREE.Vector3() }])), [])
  const b = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    const dusk = duskOf(town.minutes)
    const k = 1 - Math.exp(-dt * 8)
    town.spheres.forEach((s, n) => {
      const mesh = refs.current[s.id]
      const roof = roofs[s.on]
      if (!mesh || !roof) return
      const r = s.id === 'you' ? YOU : SPHERE
      const p = pos[s.id]
      const start = starts[s.id]
      if (start.jumps !== s.jumps) {
        start.jumps = s.jumps
        start.at.copy(p)
      }
      if (s.state === 'hover') {
        // hanging in the air where it was, slowly rising, while the houses slide underneath
        p.y += dt * 0.6
      } else if (s.state === 'jump') {
        // an arc from where it was to the roof it lands on: a hop, a bounce, or a big throw
        const u = Math.min(1, s.t / s.dur)
        b.set(roof.x, roof.y + r, roof.z)
        p.lerpVectors(start.at, b, u)
        p.y += ({ hop: 1, bounce: 2.2, throw: 7 }[s.kind] + start.at.distanceTo(b) * 0.15) * 4 * u * (1 - u)
      } else if (s.state === 'street') {
        // down in the street, at the corner of the plot in front of the building
        b.set(roof.x + PLOT / 2 + Math.cos(n) * 0.3, r, roof.z + PLOT / 2 + Math.sin(n) * 0.3)
        p.lerp(b, k * 0.4)
      } else {
        // spheres on the same roof sit side by side
        const sharing = town.spheres.filter((o) => o.state === 'sit' && o.on === s.on)
        const spread = sharing.length > 1 ? 0.45 : 0
        const angle = (sharing.indexOf(s) / sharing.length) * Math.PI * 2
        // at home it rests; on anyone else's roof it bounces, looking around
        const bounce = isHome(s) || town.phase === 'closed' ? 0 : Math.abs(Math.sin(t * 9 + n)) * 0.18
        b.set(roof.x + Math.cos(angle) * spread, roof.y + r + bounce, roof.z + Math.sin(angle) * spread)
        // the first time, it starts right there
        if (p.lengthSq() === 0) p.copy(b)
        p.lerp(b, k)
      }
      mesh.position.copy(p)
      // asleep at home: a little squashed, glowing in the dark like a lit window
      const asleep = town.phase === 'closed' && isHome(s)
      mesh.scale.set(1, asleep ? 0.8 : 1, 1)
      mesh.material.emissiveIntensity = isHome(s) ? dusk * 0.7 : 0
    })
    // a mint halo around you, so you can always find yourself
    halo.current.position.copy(pos.you)
    halo.current.scale.setScalar(1 + 0.1 * Math.sin(t * 4))
  })

  return (
    <>
      {town.spheres.map((s) => (
        <mesh key={s.id} ref={(m) => (refs.current[s.id] = m)} castShadow>
          <sphereGeometry args={[s.id === 'you' ? YOU : SPHERE, 24, 16]} />
          <meshStandardMaterial color={OWNER_COLOUR[s.id]} emissive={OWNER_COLOUR[s.id]} emissiveIntensity={0} roughness={0.5} />
        </mesh>
      ))}
      <mesh ref={halo} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.62, 0.07, 12, 48]} />
        <meshBasicMaterial color={MINT} />
      </mesh>
    </>
  )
}

// Moves the town's day forward every frame.
function Ticker() {
  useFrame((_, dt) => tickTown(Math.min(dt, 0.05)))
  return null
}

// The little card next to the pointer: what the building looks like, and whether you can hop onto
// it. It never says whose house it is: you only find out by landing on it.
function HoverCard({ index, cardRef }) {
  useTown() // redraws when a rule changes the building, or you move
  if (index === null) return <div ref={cardRef} className="hover-card" hidden />
  const b = town.buildings[index]
  const me = sphereOf('you')
  const notes = [b.lift > 0 && !b.flip && 'floating', b.flip && 'upside down'].filter(Boolean)
  let hint = null
  if (me.on === index && me.state === 'sit') hint = isHome(me) ? '⌂ Your home' : 'You are here. Not your home.'
  else if (canHopTo(index)) hint = 'Click to hop onto this roof'
  else if (town.phase === 'running' && me.state === 'sit') hint = 'Too far: hop from roof to roof'
  return (
    <div ref={cardRef} className="hover-card">
      <strong>
        {SHAPE_NAME[b.shape]} · {b.floors} {b.floors === 1 ? 'floor' : 'floors'}
      </strong>
      {notes.length > 0 && <small>{notes.join(', ')}</small>}
      {hint && <em>{hint}</em>}
    </div>
  )
}

export default function TownScene() {
  const [hovered, setHovered] = useState(null)
  const cardRef = useRef()
  const onHover = (index, x, y) => {
    setHovered(index)
    document.body.style.cursor = index === null ? '' : 'pointer'
    if (cardRef.current && index !== null) cardRef.current.style.transform = `translate(${x + 16}px, ${y + 12}px)`
  }

  // the space bar makes you sneeze
  useEffect(() => {
    const down = (e) => {
      if (e.code !== 'Space' || e.repeat) return
      e.preventDefault()
      sneeze('you')
    }
    window.addEventListener('keydown', down)
    return () => window.removeEventListener('keydown', down)
  }, [])

  return (
    <>
      <Canvas
        orthographic
        shadows
        flat
        dpr={[1, 2]}
        camera={{ position: [30, 30, 30], zoom: 30, near: 0.1, far: 200 }}
        onPointerMissed={() => onHover(null)}
      >
        <FitCamera />
        <Lights />
        <Ticker />
        <Ground />
        <ClockTower />
        {town.buildings.map((b, i) => (
          <Building key={b.id} index={i} onHover={onHover} />
        ))}
        <Spheres />
      </Canvas>
      <HoverCard index={hovered} cardRef={cardRef} />
    </>
  )
}
