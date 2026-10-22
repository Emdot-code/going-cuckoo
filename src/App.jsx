import { useState } from 'react'
import StudioScene from './StudioScene.jsx'
import CuckooView from './CuckooView.jsx'
import SafeView from './SafeView.jsx'
import { ClockPanel, DaemonOverlay, EndPanel, LawBubble, TaskPanel, ToolTray } from './Hud.jsx'
import { resetGame } from './game.js'

// Where the stars are in the night sky, as % of the width and height (always the same ones).
const STARS = Array.from({ length: 40 }, (_, i) => ({ left: `${(i * 37 + 11) % 100}%`, top: `${(i * 53 + 7) % 55}%` }))

// The sunset behind the studio: a pale sun and three layers of soft dunes, like a landscape
// from Alto's Adventure or Journey.
// dusk (used by the town): 0 in daylight, 1 at night. The sun sinks behind the dunes and glows
// deeper orange, the sky turns night blue, and the stars come out.
// sun (used by the city): how far the sun has sunk, from 0 at noon to 1 at sunset, if it should
// sink all day long rather than only at dusk.
export function Landscape({ dusk = 0, sun = dusk }) {
  return (
    <div className="landscape" aria-hidden="true">
      <div className="night-sky" style={{ opacity: dusk }}>
        <div className="stars" style={{ opacity: Math.max(0, dusk * 2 - 1) }}>
          {STARS.map((style, i) => (
            <i key={i} style={style} />
          ))}
        </div>
      </div>
      <div className="sun" style={sun ? { top: `${12 + sun * 62}%`, filter: `saturate(${1 + sun * 2}) hue-rotate(${-sun * 15}deg)` } : undefined} />
      <svg viewBox="0 0 1200 300" preserveAspectRatio="none">
        <path className="dune far" d="M0 170 C 180 110 320 120 480 150 S 820 90 1000 130 S 1150 150 1200 120 V300 H0 Z" />
        <path className="dune mid" d="M0 220 C 160 170 360 190 520 210 S 860 160 1040 190 S 1160 205 1200 190 V300 H0 Z" />
        <path className="dune near" d="M0 260 C 220 225 420 240 640 255 S 980 225 1200 245 V300 H0 Z" />
      </svg>
      <div className="night-land" style={{ opacity: dusk * 0.6 }} />
    </div>
  )
}

export default function App() {
  // starting a new day rebuilds the scene, so everyone is back at their desk
  const [day, setDay] = useState(0)
  const restart = () => {
    resetGame()
    setDay((d) => d + 1)
  }

  return (
    <div className="app">
      <Landscape />
      <SafeView label="The studio view" className="broken-studio">
        <StudioScene key={day} />
      </SafeView>
      <DaemonOverlay />

      <header className="panel title">
        <h1>going cuckoo</h1>
        <span className="dots" aria-hidden="true">
          <i className="red" />
          <i className="mint" />
          <i className="yellow" />
        </span>
        <p>An open-plan architecture studio. Something lives in the clock.</p>
      </header>

      <div className="right-column">
        <ClockPanel />
        <SafeView label="The cuckoo close-up">
          <CuckooView />
        </SafeView>
        <LawBubble />
      </div>
      <TaskPanel />
      <ToolTray />

      <footer className="panel hint">
        <span className="keys">
          <kbd>W</kbd>
          <kbd>A</kbd>
          <kbd>S</kbd>
          <kbd>D</kbd>
        </span>
        or arrow keys to walk
      </footer>

      <EndPanel onRestart={restart} />
    </div>
  )
}
