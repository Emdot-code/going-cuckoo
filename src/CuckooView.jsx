// A close-up of the cuckoo clock, in its own small window under the digital clock.
// It is the very same clock as the one on the studio wall (CuckooClock.jsx), seen from the
// front and a little from the side, so you can watch the daemon spring out of its door.

import { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { CLOCK, ROOM } from './studio.js'
import CuckooClock from './CuckooClock.jsx'
import { GROUND_LIGHT, SKY_LIGHT, SUN } from './palette.js'

// The clock's middle and its size, in metres (from the tip of the roof down to the pendulum).
const CENTRE = [CLOCK.x, CLOCK.y - 0.2 * CLOCK.scale, -ROOM.d / 2]
const CLOCK_W = 1.1 * CLOCK.scale
const CLOCK_H = 1.6 * CLOCK.scale

// Looks at the clock from the front right and zooms so it fills the window.
function FitClock() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  useEffect(() => {
    camera.position.set(CENTRE[0] + 3, CENTRE[1] + 1.2, CENTRE[2] + 10)
    camera.zoom = Math.min(size.width / CLOCK_W, size.height / CLOCK_H)
    camera.lookAt(...CENTRE)
    camera.updateProjectionMatrix()
  }, [camera, size])
  return null
}

// state: whose clock to show (the studio's game by default, or the town).
export default function CuckooView({ state }) {
  return (
    <section className="panel cuckoo-panel" aria-label="The cuckoo clock, close up">
      <span className="eyebrow">The cuckoo</span>
      <div className="cuckoo-window">
        <Canvas orthographic flat dpr={[1, 2]} camera={{ near: 0.1, far: 50 }}>
          <FitClock />
          <hemisphereLight args={[SKY_LIGHT, GROUND_LIGHT, 1.9]} />
          <directionalLight position={[-3, 4, 6]} color={SUN} intensity={1.2} />
          <CuckooClock state={state} />
        </Canvas>
      </div>
    </section>
  )
}
