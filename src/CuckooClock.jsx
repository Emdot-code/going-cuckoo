// The cuckoo clock on the back wall, after the modern one in the "ref images" folder: a little
// house in one muted sage green, with rounded bottom corners, a gabled roof, an arched dormer
// with a round porthole near the ridge, two pale hands and no numbers, and a flat pendulum with
// a round disc. It is drawn much bigger than a real one so it can't be missed. Its hands show
// the studio time.
//
// Behind the porthole sleeps the daemon. Every full hour it wakes: the clock shakes, the little
// door flies open, the daemon springs out, yawns, blinks, looks around, announces a new law
// (its speech bubble is LawBubble in Hud.jsx, under the close-up), and goes back in.

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CLOCK, ROOM } from './studio.js'
import { game } from './game.js'
import { CLOCK_GREEN, CLOCK_HANDS, INK, MINT, RED, STEEL, YELLOW } from './palette.js'

// Heights on the clock (in the clock's own size, before it is scaled up): the porthole and the
// middle of the face, where the hands turn.
const PORTHOLE_Y = 0.25
const FACE_Y = -0.17

// The outlines that are pushed out into solid shapes: the body, the roof and the dormer.
function clockShapes() {
  const body = new THREE.Shape()
  const w = 0.28 // half the width
  const r = 0.11 // the rounded corners
  body.moveTo(-w, 0.12)
  body.lineTo(-w, -0.44 + r)
  body.absarc(-w + r, -0.44 + r, r, Math.PI, Math.PI * 1.5)
  body.lineTo(w - r, -0.44)
  body.absarc(w - r, -0.44 + r, r, Math.PI * 1.5, Math.PI * 2)
  body.lineTo(w, 0.12)
  body.closePath()

  const roof = new THREE.Shape()
  roof.moveTo(-0.4, 0.08)
  roof.lineTo(0.4, 0.08)
  roof.lineTo(0, 0.5)
  roof.closePath()

  const dormer = new THREE.Shape()
  const a = 0.085
  dormer.moveTo(-a, 0.08)
  dormer.lineTo(a, 0.08)
  dormer.lineTo(a, PORTHOLE_Y)
  dormer.absarc(0, PORTHOLE_Y, a, 0, Math.PI)
  dormer.closePath()
  return { body, roof, dormer }
}

// A flat outline pushed out `depth` towards the viewer, starting at z.
function Solid({ shape, depth, z }) {
  const geometry = useMemo(() => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 24 }), [shape, depth])
  return (
    <mesh geometry={geometry} position={[0, 0, z]} castShadow receiveShadow>
      <meshStandardMaterial color={CLOCK_GREEN} roughness={0.55} />
    </mesh>
  )
}

function Part({ p, s, c, r, geo = 'box', basic }) {
  return (
    <mesh position={p} rotation={r} castShadow={!basic}>
      {geo === 'box' && <boxGeometry args={s} />}
      {geo === 'cyl' && <cylinderGeometry args={s} />}
      {geo === 'ball' && <sphereGeometry args={s} />}
      {geo === 'cone' && <coneGeometry args={s} />}
      {basic ? <meshBasicMaterial color={c} /> : <meshStandardMaterial color={c} roughness={0.7} />}
    </mesh>
  )
}

// The daemon is tiny in the story, but drawn twice its size so you can see its face.
const DAEMON_SIZE = 2

const clamp01 = (x) => Math.min(1, Math.max(0, x))
const ease = (x) => {
  const t = clamp01(x)
  return t * t * (3 - 2 * t)
}

// The daemon's timeline, in seconds since it woke (see DAEMON_SECONDS in game.js).
function daemonPose(t) {
  const shake = t < 0.9 ? Math.sin(t * 70) * 0.05 * (1 - t / 0.9) : 0
  const door = ease((t - 0.35) / 0.35) * (1 - ease((t - 6.2) / 0.4))
  // springs out with a wobble, then slides back in
  const u = t - 0.7
  const spring = u > 0 ? 1 - Math.exp(-5 * u) * Math.cos(13 * u) : 0
  const out = spring * (1 - ease((t - 5.5) / 0.6))
  // eyes: shut, then sleepy, then wide open, with one blink
  let eyes = 0.12
  if (t > 1.9) eyes = 0.12 + 0.88 * ease((t - 1.9) / 0.3)
  if (t > 3.6 && t < 3.8) eyes = 0.1
  if (t > 5.3) eyes = 1 - 0.8 * ease((t - 5.3) / 0.3)
  // a big yawn
  const yawn = Math.sin(Math.PI * clamp01((t - 1.0) / 0.9))
  // looks around the room
  const look = t > 2.2 && t < 5.4 ? Math.sin((t - 2.2) * 2.4) * 0.6 : 0
  return { shake, door, out, eyes, yawn, look, hat: 0, bow: 0 }
}

// When all three tasks are done, in seconds since: the daemon springs out wide awake, lifts its
// nightcap off and bows to you, again and again, with the hat in its hand.
function bowPose(t) {
  const door = ease(t / 0.35)
  const u = t - 0.3
  const out = u > 0 ? 1 - Math.exp(-5 * u) * Math.cos(13 * u) : 0
  const hat = ease((t - 1.3) / 0.5) // 0 on its head, 1 held up in its hand
  const p = (t - 1.9) % 3 // a bow every 3 seconds: down, hold, up, pause
  const bow = t > 1.9 ? ease(p / 0.45) * (1 - ease((p - 1.6) / 0.45)) : 0
  return { shake: 0, door, out, eyes: 1, yawn: 0, look: 0, hat, bow }
}

// Where the nightcap sits on the head, and the shoulder its right arm turns around.
const CAP = { x: -0.01, y: 0.085, z: -0.01, r: 0.7 }
const SHOULDER = { x: 0.0624, y: -0.0396, z: 0.02 }
const ARM_LENGTH = 0.04

// (the city's clock tower uses it too, in CityScene.jsx)
export function Daemon({ daemonRef, eyeRefs, mouthRef, hatRef, armRef }) {
  return (
    <group ref={daemonRef} visible={false}>
      {/* the spring it sits on, stretched out from the door */}
      <mesh name="spring" position={[0, -0.02, -0.08]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 1, 6]} />
        <meshStandardMaterial color={STEEL} />
      </mesh>
      <group name="head">
        <Part p={[0, 0, 0]} s={[0.075, 18, 14]} geo="ball" c={INK} />
        {/* horns */}
        {[-1, 1].map((s) => (
          <Part key={s} p={[s * 0.045, 0.07, 0]} s={[0.018, 0.05, 10]} r={[0, 0, -s * 0.4]} geo="cone" c={RED} />
        ))}
        {/* a sleepy nightcap */}
        <group ref={hatRef} position={[CAP.x, CAP.y, CAP.z]} rotation={[0, 0, CAP.r]}>
          <Part p={[0, 0, 0]} s={[0.05, 0.09, 14]} geo="cone" c={MINT} />
          <Part p={[-0.015, 0.052, 0]} s={[0.016, 10, 8]} geo="ball" c={YELLOW} />
        </group>
{/* glowing eyes */}
        {[-1, 1].map((s, i) => (
          <mesh key={s} ref={(m) => (eyeRefs.current[i] = m)} position={[s * 0.028, 0.012, 0.066]}>
            <sphereGeometry args={[0.017, 12, 10]} />
            <meshBasicMaterial color={YELLOW} />
          </mesh>
        ))}
        {/* the mouth, for yawning */}
        <mesh ref={mouthRef} position={[0, -0.03, 0.068]}>
          <sphereGeometry args={[0.018, 12, 10]} />
          <meshBasicMaterial color={RED} />
        </mesh>
        {/* little arms */}
        <Part p={[-0.08, -0.03, 0.02]} s={[ARM_LENGTH, 0.012, 0.012]} r={[0, 0, -0.5]} c={INK} />
        {/* the right arm can lift the nightcap off */}
        <mesh ref={armRef} position={[0.08, -0.03, 0.02]} rotation={[0, 0, 0.5]} castShadow>
          <boxGeometry args={[ARM_LENGTH, 0.012, 0.012]} />
          <meshStandardMaterial color={INK} roughness={0.7} />
        </mesh>
      </group>
    </group>
  )
}

// state: whose clock it shows (the studio's game, or the town). position and scale place it
// somewhere else than the studio wall, such as on the town's clock tower.
export default function CuckooClock({ state = game, position, scale = CLOCK.scale }) {
  const body = useRef()
  const pendulum = useRef()
  const minute = useRef()
  const hour = useRef()
  const door = useRef()
  const daemon = useRef()
  const eyes = useRef([])
  const mouth = useRef()
  const hat = useRef()
  const arm = useRef()
  const doneT = useRef(0) // seconds since all tasks were finished

  const k = scale
  const z = -ROOM.d / 2 + 0.1 * k
  const shapes = useMemo(clockShapes, [])

  useFrame(({ clock }, dt) => {
    // the hands show the studio time
    minute.current.rotation.z = -((state.minutes % 60) / 60) * Math.PI * 2
    hour.current.rotation.z = -(((state.minutes / 60) % 12) / 12) * Math.PI * 2

    const awake = state.phase === 'daemon'
    // the pendulum stops while time stands still
    if (!awake) pendulum.current.rotation.z = Math.sin(clock.elapsedTime * 2.2) * 0.3

    const done = state.phase === 'done'
    doneT.current = done ? doneT.current + dt : 0
    const pose = done ? bowPose(doneT.current) : daemonPose(awake ? state.daemonT : 99)
    body.current.rotation.z = pose.shake
    door.current.rotation.y = -pose.door * 1.9
    const d = daemon.current
    d.visible = pose.out > 0.02
    const reach = pose.out * 0.5 // how far it has sprung out of the door
    const grow = DAEMON_SIZE * (0.4 + 0.6 * clamp01(pose.out * 1.4))
    d.position.set(0, PORTHOLE_Y + Math.sin(clock.elapsedTime * 5) * 0.01 * pose.out, 0.12 + reach)
    d.scale.setScalar(grow)
    // the spring reaches back to the doorway (it sits inside the scaled daemon, hence / grow)
    const spring = d.getObjectByName('spring')
    spring.scale.y = Math.max(0.01, reach / grow)
    spring.position.z = -reach / grow / 2
    d.getObjectByName('head').rotation.set(pose.bow * 0.75, pose.look, 0)
    for (const e of eyes.current) if (e) e.scale.y = pose.eyes
    mouth.current.scale.set(1 + pose.yawn * 0.4, 0.3 + pose.yawn * 1.6, 1)

    // the right arm reaches up for the hat, then sweeps down with it in each bow
    const a = 0.5 + pose.hat * 0.6 - pose.bow * 0.9
    const len = ARM_LENGTH * (1 + pose.hat * 0.75)
    arm.current.rotation.z = a
    arm.current.scale.x = len / ARM_LENGTH
    arm.current.position.set(SHOULDER.x + (len / 2) * Math.cos(a), SHOULDER.y + (len / 2) * Math.sin(a), SHOULDER.z)
    // the hat goes from the head to the tip of the arm, in a little arc
    const tipX = SHOULDER.x + len * Math.cos(a) + 0.006
    const tipY = SHOULDER.y + len * Math.sin(a) + 0.025
    const h = pose.hat
    hat.current.position.set(
      THREE.MathUtils.lerp(CAP.x, tipX, h),
      THREE.MathUtils.lerp(CAP.y, tipY, h) + Math.sin(Math.PI * h) * 0.04,
      THREE.MathUtils.lerp(CAP.z, 0.03, h),
    )
    hat.current.rotation.z = THREE.MathUtils.lerp(CAP.r, -0.6 - pose.bow * 0.8, h)
  })

  return (
    <group position={position ?? [CLOCK.x, CLOCK.y, z]} scale={k}>
      <group ref={body}>
        {/* the house, with rounded bottom corners, and its gabled roof */}
        <Solid shape={shapes.body} depth={0.16} z={-0.08} />
        <Solid shape={shapes.roof} depth={0.2} z={-0.1} />
        {/* the arched dormer in the roof, with the round porthole the daemon lives behind */}
        <Solid shape={shapes.dormer} depth={0.05} z={0.1} />
        <Part p={[0, PORTHOLE_Y, 0.152]} s={[0.058, 0.058, 0.006, 32]} r={[Math.PI / 2, 0, 0]} geo="cyl" c={CLOCK_HANDS} />
        <Part p={[0, PORTHOLE_Y, 0.156]} s={[0.044, 0.044, 0.006, 32]} r={[Math.PI / 2, 0, 0]} geo="cyl" c="#1d1a26" basic />
        <group ref={door} position={[-0.044, PORTHOLE_Y, 0.162]}>
          <Part p={[0.044, 0, 0]} s={[0.044, 0.044, 0.008, 32]} r={[Math.PI / 2, 0, 0]} geo="cyl" c={INK} />
        </group>
        <Daemon daemonRef={daemon} eyeRefs={eyes} mouthRef={mouth} hatRef={hat} armRef={arm} />
        {/* no numbers on the face, only two pale hands */}
        <group ref={hour} position={[0, FACE_Y, 0.085]}>
          <Part p={[0, 0.045, 0]} s={[0.016, 0.11, 0.006]} c={CLOCK_HANDS} />
        </group>
        <group ref={minute} position={[0, FACE_Y, 0.092]}>
          <Part p={[0, 0.075, 0]} s={[0.012, 0.17, 0.006]} c={CLOCK_HANDS} />
        </group>
        <Part p={[0, FACE_Y, 0.098]} s={[0.012, 0.012, 0.012, 12]} r={[Math.PI / 2, 0, 0]} geo="cyl" c={STEEL} />
        {/* the flat pendulum with its round disc */}
        <group ref={pendulum} position={[0, -0.38, 0.0]}>
          <Part p={[0, -0.2, 0]} s={[0.028, 0.4, 0.012]} c={CLOCK_GREEN} />
          <Part p={[0, -0.42, 0]} s={[0.075, 0.075, 0.025, 40]} r={[Math.PI / 2, 0, 0]} geo="cyl" c={CLOCK_GREEN} />
        </group>
      </group>
    </group>
  )
}
