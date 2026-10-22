// Everyone's belongings on the desks: pencils in a cup, a set square, a scale ruler and a
// reference book. Yours keep their full colour and sit on a softly pulsing mint glow; everyone
// else's are faded and locked. Point at any of them to see whose it is. When the daemon's law
// hands something to a new owner, it floats over to their desk.

import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { DESK_BY_ID, DESK_SIZE, DESK_SCALE, PEOPLE } from './studio.js'
import { KINDS, LABEL } from './belongings.js'
import { game, useGame } from './game.js'
import { BLUE, MINT, PAPER, RED, STEEL, TERRACOTTA, YELLOW } from './palette.js'

// Belongings are drawn this many times bigger than real (on top of the desk scale), so
// they are easy to spot and to point at from up in the isometric view.
const BELONGING_SCALE = 2.2

const SLOT = Object.fromEntries(KINDS.map((k) => [k.kind, k.slot]))
const NAME = Object.fromEntries(PEOPLE.map((p) => [p.id, p.name]))
// Each person's own colour, for the book cover and set square they brought. Yours is yellow, like you.
const OWN_COLOUR = Object.fromEntries(PEOPLE.map((p, i) => [p.id, [YELLOW, RED, BLUE, MINT, TERRACOTTA, '#b9a2cf'][i % 6]]))

// Other people's things are faded towards a soft grey-mauve.
const FADED = new THREE.Color('#c9bec7')
const fade = (c) => '#' + new THREE.Color(c).lerp(FADED, 0.65).getHexString()
const asIs = (c) => c

function Box({ p, s, c, r }) {
  return (
    <mesh position={p} rotation={r} castShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} roughness={0.8} />
    </mesh>
  )
}

function Cyl({ p, args, c, r }) {
  return (
    <mesh position={p} rotation={r} castShadow>
      <cylinderGeometry args={args} />
      <meshStandardMaterial color={c} roughness={0.7} />
    </mesh>
  )
}

// The models, in real size, standing on the desk top. tone() fades a colour if it isn't yours.
function Pencils({ tone }) {
  return (
    <group>
      <Cyl p={[0, 0.045, 0]} args={[0.035, 0.03, 0.09, 14]} c={tone(STEEL)} />
      {[[RED, -0.012, -0.01, 0.15], [YELLOW, 0.012, -0.008, -0.12], [MINT, -0.004, 0.013, 0.05], [BLUE, 0.01, 0.01, -0.2]].map(([c, x, z, tilt], i) => (
        <Cyl key={i} p={[x, 0.11, z]} args={[0.006, 0.006, 0.17, 6]} r={[tilt, 0, tilt * 0.7]} c={tone(c)} />
      ))}
    </group>
  )
}

function SetSquare({ tone, colour }) {
  return <Cyl p={[0, 0.005, 0]} args={[0.12, 0.12, 0.01, 3]} r={[0, 0.4, 0]} c={tone(colour)} />
}

function ScaleRuler({ tone }) {
  return (
    <group rotation={[0, -0.15, 0]}>
      <Cyl p={[0, 0.018, 0]} args={[0.022, 0.022, 0.3, 3]} r={[0, 0, Math.PI / 2]} c={tone(PAPER)} />
      <Cyl p={[0.15, 0.018, 0]} args={[0.023, 0.023, 0.01, 3]} r={[0, 0, Math.PI / 2]} c={tone(RED)} />
    </group>
  )
}

function Book({ tone, colour }) {
  return (
    <group rotation={[0, 0.25, 0]}>
      <Box p={[0, 0.03, 0]} s={[0.24, 0.06, 0.17]} c={tone(colour)} />
      <Box p={[0.006, 0.03, 0]} s={[0.236, 0.048, 0.158]} c={tone(PAPER)} />
    </group>
  )
}

const MODELS = { pencils: Pencils, setsquare: SetSquare, ruler: ScaleRuler, book: Book }

// When one desk gets several things of the same kind, they pile up: each next one this much
// further along (in the thing's own real size). Pencil cups line up towards the back of the
// desk, the rest stack.
const PILE = { pencils: [0, 0, -0.08], setsquare: [0, 0.012, 0], ruler: [0, 0.047, 0], book: [0, 0.062, 0] }

// How long a thing floats to its new desk, in seconds, and how high it rises on the way.
const FLIGHT = 1.8
const LIFT = 2.2

const ease = (t) => t * t * (3 - 2 * t)

export default function Belongings() {
  const { owners } = useGame() // redraw whenever someone's things change hands
  const [hover, setHover] = useState(null)
  const glow = useMemo(() => new THREE.MeshBasicMaterial({ color: MINT, transparent: true, depthWrite: false }), [])
  const groups = useRef({})
  const flights = useRef({})

  const y = DESK_SIZE.h * DESK_SCALE
  const items = useMemo(() => {
    const piles = {}
    return game.belongings.map((b) => {
      const desk = DESK_BY_ID[b.desk]
      const [sx, sz] = SLOT[b.kind]
      const n = (piles[b.desk + b.kind] = (piles[b.desk + b.kind] ?? -1) + 1) // how many are already on this pile
      const [px, py, pz] = PILE[b.kind].map((d) => d * n * DESK_SCALE * BELONGING_SCALE)
      const mine = b.owner === 'you'
      return { ...b, mine, x: desk.x + sx * DESK_SCALE + px, y: y + py, z: desk.z + sz * DESK_SCALE + pz }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owners])

  useFrame(({ clock }, dt) => {
    // your things glow softly, all together
    glow.opacity = 0.6 + 0.3 * Math.sin(clock.elapsedTime * 3)

    // things that have a new place float there in a high arc, turning as they go, one shortly after the other
    items.forEach((b, i) => {
      const g = groups.current[b.id]
      if (!g) return
      let f = flights.current[b.id]
      if (!f) f = flights.current[b.id] = { from: new THREE.Vector3(b.x, b.y, b.z), to: new THREE.Vector3(b.x, b.y, b.z), t: 1 }
      if (f.to.x !== b.x || f.to.y !== b.y || f.to.z !== b.z) {
        f.from.copy(g.position)
        f.to.set(b.x, b.y, b.z)
        f.t = -0.04 * (i % 12) // a small delay, so they don't all lift off at once
      }
      f.t = Math.min(1, f.t + dt / FLIGHT)
      const k = ease(Math.max(0, f.t))
      g.position.lerpVectors(f.from, f.to, k)
      g.position.y += Math.sin(Math.PI * k) * LIFT
      g.rotation.y = k < 1 ? k * Math.PI * 2 : 0
    })
  })

  const shown = items.find((b) => b.id === hover)
  const point = (id) => (e) => {
    e.stopPropagation()
    setHover(id)
    document.body.style.cursor = 'pointer'
  }
  const leave = (id) => () => {
    setHover((h) => (h === id ? null : h))
    document.body.style.cursor = ''
  }

  return (
    <group>
      {items.map((b) => {
        const Model = MODELS[b.kind]
        return (
          <group
            key={b.id}
            ref={(g) => (groups.current[b.id] = g)}
            scale={DESK_SCALE * BELONGING_SCALE}
            onPointerOver={point(b.id)}
            onPointerOut={leave(b.id)}
          >
            {b.mine && (
              <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={5} material={glow}>
                <circleGeometry args={[0.17, 32]} />
              </mesh>
            )}
            <Model tone={b.mine ? asIs : fade} colour={OWN_COLOUR[b.origin]} />
          </group>
        )
      })}
      {shown && (
        <Html position={[shown.x, shown.y + 1.1, shown.z]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className={shown.mine ? 'item-tag mine' : 'item-tag'}>
            {shown.mine ? `Your ${LABEL[shown.kind]}` : `${NAME[shown.owner]}'s ${LABEL[shown.kind]} · locked 🔒`}
            {shown.origin !== shown.owner && ` (was ${shown.origin === 'you' ? 'yours' : `${NAME[shown.origin]}'s`})`}
          </div>
        </Html>
      )}
    </group>
  )
}
