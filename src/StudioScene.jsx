// The 3D view: the studio seen from above at an angle, as a true isometric drawing (the camera
// looks down the diagonal of a cube), so the room reads as a block floating in the sky.
// A fixed orthographic camera (no perspective), so parallel lines stay parallel.
// The building is in Room.jsx, the furniture in Furniture.jsx, everyone's things in
// Belongings.jsx and the clock in CuckooClock.jsx.

import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { DESK_BY_ID, PEOPLE, ROOM, SUN_DIR, seatOf } from './studio.js'
import { createBodies, headToDesks, stepWorld, useKeyboard } from './movement.js'
import { canDo, game, tick, useGame } from './game.js'
import { TASKS } from './tasks.js'
import { Floor, ShadowRoof, SunBeams, Walls } from './Room.jsx'
import { Furniture } from './Furniture.jsx'
import CuckooClock from './CuckooClock.jsx'
import Belongings from './Belongings.jsx'
import { CLOTHES, GROUND_LIGHT, SKIN, SKY_LIGHT, SUN, YELLOW } from './palette.js'

// Zooms so the whole room fits the window, also when the window is resized.
function FitCamera() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  useEffect(() => {
    // how wide and tall the room looks in a true isometric view, plus a little margin
    const across = ROOM.w + ROOM.d
    const wide = across * Math.SQRT1_2 * 1.12
    const tall = across * 0.408 + (ROOM.wallH + ROOM.slab) * 0.816 + 2.2
    camera.zoom = Math.min(size.width / wide, size.height / tall)
    camera.lookAt(0, 1.2, 0)
    camera.updateProjectionMatrix()
  }, [camera, size])
  return null
}

// Soft sunset light everywhere (warm from above, lavender from below), plus the sun, which only gets in through the windows.
function Lights() {
  const sun = useMemo(() => new THREE.Vector3(...SUN_DIR).normalize().multiplyScalar(-30), [])
  return (
    <>
      <hemisphereLight args={[SKY_LIGHT, GROUND_LIGHT, 1.7]} />
      <directionalLight
        position={sun.toArray()}
        color={SUN}
        intensity={1.6}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-camera-far={70}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
    </>
  )
}

// A simple person: body, head, a cap of hair and a nose so you can see which way they face.
// Taller people really are taller.
function Person({ person, clothes, bodyRef }) {
  const h = person.height
  const headR = 0.15
  const bodyTop = h - headR * 2 - 0.02
  const bodyR = 0.21
  return (
    <group ref={bodyRef}>
      <group name="bob">
        <mesh position={[0, bodyTop / 2, 0]} castShadow>
          <capsuleGeometry args={[bodyR, Math.max(0.1, bodyTop - bodyR * 2), 6, 16]} />
          <meshStandardMaterial color={clothes} roughness={0.8} />
        </mesh>
        <mesh position={[0, h - headR, 0]} castShadow>
          <sphereGeometry args={[headR, 20, 14]} />
          <meshStandardMaterial color={SKIN} roughness={0.8} />
        </mesh>
        <mesh position={[0, h - headR + 0.02, -0.015]} castShadow>
          <sphereGeometry args={[headR + 0.02, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={person.hair} roughness={0.9} />
        </mesh>
        <mesh position={[0, h - headR - 0.02, headR]}>
          <boxGeometry args={[0.04, 0.04, 0.06]} />
          <meshStandardMaterial color={SKIN} />
        </mesh>
      </group>
    </group>
  )
}

const HEIGHT = Object.fromEntries(PEOPLE.map((p) => [p.id, p.height]))
// Where you stand to work on a task: its own spot, or for the floor plan in front of the desk
// that is yours under the current law.
const spotOf = (task) => task.spot ?? seatOf(DESK_BY_ID[game.desks.you])

// Whether each task is finished, and whether you lack a tool for it.
function useTaskStates() {
  const { progress, missing } = useGame()
  const done = progress.split(',').map(Number)
  return TASKS.map((t, i) => ({ done: done[i] >= 100, blocked: !canDo(t, missing) }))
}

// A ring on the floor in the task's colour, with a soft disc inside. It pulses while you could
// work there, glows steady while you do, and goes faint while you lack a tool for it or once the
// task is finished. The floor plan's ring follows your desk. Its name tag (a page element, like
// the people's) is kept just in front of it.
function TaskSpot({ task, tagRefs }) {
  const { done, blocked } = useTaskStates()[TASKS.indexOf(task)]
  const group = useRef()
  const ring = useRef()
  const disc = useRef()
  const v = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ clock, camera, size }) => {
    const spot = spotOf(task)
    group.current.position.set(spot.x, 0.07, spot.z)
    const here = game.working && game.at === task.id
    const o = done || blocked ? 0.25 : here ? 1 : 0.65 + 0.3 * Math.sin(clock.elapsedTime * 4)
    ring.current.opacity = o
    disc.current.opacity = o * 0.45
    // the tag hangs just below the ring (seen from above at an angle, the ring looks
    // 0.58 times as tall as it is wide), so it never covers it
    const tag = tagRefs.current[task.id]
    if (!tag) return
    v.set(spot.x, 0, spot.z).project(camera)
    const below = 0.52 * 0.58 * camera.zoom + 4
    tag.style.transform = `translate(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height + below}px) translate(-50%, 0)`
  })
  return (
    <group ref={group}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={4}>
        <ringGeometry args={[0.38, 0.54, 40]} />
        <meshBasicMaterial ref={ring} color={task.colour} transparent depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={4}>
        <circleGeometry args={[0.4, 40]} />
        <meshBasicMaterial ref={disc} color={task.colour} transparent depthWrite={false} />
      </mesh>
    </group>
  )
}

// The names above the rings, faded with a lock while you lack a tool, and ticked off once done.
function SpotTags({ tagRefs }) {
  const states = useTaskStates()
  return TASKS.map((t, i) => {
    const { done, blocked } = states[i]
    return (
      <div
        key={t.id}
        ref={(el) => (tagRefs.current[t.id] = el)}
        className={`tag spot-tag${blocked || done ? ' is-faded' : ''}`}
        style={{ '--task': t.colour }}
      >
        {done ? '✓ ' : ''}
        {t.name}
        {blocked && !done ? ' 🔒' : ''}
      </div>
    )
  })
}

// Which task's spot you are standing at, if any.
function taskAt(you) {
  const task = TASKS.find((t) => {
    const spot = spotOf(t)
    return Math.hypot(you.x - spot.x, you.z - spot.z) < 0.55
  })
  return task?.id ?? null
}

// Runs the movement every frame and moves the people (and their name tags) on screen to match.
// The name tags are page elements kept above the heads, the same way as the labels in the city project.
function People({ tagRefs }) {
  const keys = useKeyboard()
  const bodies = useMemo(createBodies, [])
  const lawsSeen = useRef(0)
  const refs = useRef({})
  const v = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock, camera, size }, dt) => {
    dt = Math.min(dt, 0.05)
    // you work on a task while you stand at its spot
    tick(dt, taskAt(bodies.find((b) => b.player)))
    // a new law has taken effect: the colleagues go and find their new desks
    if (game.lawCount !== lawsSeen.current) {
      lawsSeen.current = game.lawCount
      headToDesks(bodies)
    }
    // while the daemon is awake, time stands still and everyone freezes
    if (game.phase === 'running') stepWorld(bodies, keys, dt)
    else for (const b of bodies) b.moving = false
    const t = clock.elapsedTime
    for (const b of bodies) {
      const g = refs.current[b.id]
      if (!g) continue
      g.position.set(b.x, 0, b.z)
      g.rotation.y = b.facing
      g.getObjectByName('bob').position.y = b.moving ? Math.abs(Math.sin(t * 11)) * 0.05 : 0
      const tag = tagRefs.current[b.id]
      if (!tag) continue
      v.set(b.x, HEIGHT[b.id] + 0.25, b.z).project(camera)
      tag.style.transform = `translate(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px) translate(-50%, -100%)`
    }
  })

  let n = 0
  return PEOPLE.map((p) => (
    <Person
      key={p.id}
      person={p}
      clothes={p.player ? YELLOW : CLOTHES[n++ % CLOTHES.length]}
      bodyRef={(g) => (refs.current[p.id] = g)}
    />
  ))
}

export default function StudioScene() {
  const tagRefs = useRef({})
  const spotTagRefs = useRef({})
  return (
    <>
      <Canvas
        orthographic
        shadows
        flat
        dpr={[1, 2]}
        camera={{ position: [20, 20, 20], zoom: 40, near: 0.1, far: 200 }}
      >
        <FitCamera />
        <Lights />
        <Floor />
        <Walls />
        <ShadowRoof />
        <Furniture />
        <Belongings />
        <CuckooClock />
        <SunBeams />
        {TASKS.map((t) => (
          <TaskSpot key={t.id} task={t} tagRefs={spotTagRefs} />
        ))}
        <People tagRefs={tagRefs} />
      </Canvas>
      <SpotTags tagRefs={spotTagRefs} />
      {PEOPLE.map((p) => (
        <div key={p.id} ref={(el) => (tagRefs.current[p.id] = el)} className={p.player ? 'tag tag-you' : 'tag'}>
          {p.name}
        </div>
      ))}
    </>
  )
}
