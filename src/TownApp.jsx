// The page for the town: the 3D town in the middle of the sunset (which turns to night by 18:00),
// with the panels around it.
// (The studio game is still in App.jsx; main.jsx decides which of the two the page shows.)

import { useState } from 'react'
import TownScene from './TownScene.jsx'
import CuckooView from './CuckooView.jsx'
import SafeView from './SafeView.jsx'
import { DemonOverlay, GoalPanel, ResidentsPanel, RuleBubble, TownClock, TownEnd, TownNote, TownSky } from './TownHud.jsx'
import { resetTown, town } from './townGame.js'

export default function TownApp() {
  // a new day rebuilds the town from scratch
  const [day, setDay] = useState(0)
  const restart = () => {
    resetTown()
    setDay((d) => d + 1)
  }

  return (
    <div className="app">
      <TownSky />
      <SafeView label="The town view" className="broken-studio">
        <TownScene key={day} />
      </SafeView>
      <DemonOverlay />

      <header className="panel title">
        <h1>cuckoo city</h1>
        <span className="dots" aria-hidden="true">
          <i className="red" />
          <i className="mint" />
          <i className="yellow" />
        </span>
        <p>A floating town. A demon lives in the clock tower and every hour decides who owns which house, then moves all the houses. Find your home before night falls.</p>
      </header>

      <div className="right-column">
        <TownClock />
        <SafeView label="The cuckoo close-up">
          <CuckooView state={town} />
        </SafeView>
        <RuleBubble />
      </div>
      <ResidentsPanel />

      <GoalPanel />
      <TownNote />

      <TownEnd onRestart={restart} />
    </div>
  )
}
