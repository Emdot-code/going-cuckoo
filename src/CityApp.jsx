// The page for Going Cuckoo: the 3D city in the middle of the sunset, and a few small things
// around it. You hop from roof to roof with the arrow keys or W, A, S, D, fetching your groceries
// from the shop one at a time.
// (The studio and the older sphere town are still in App.jsx and TownApp.jsx; main.jsx decides
// which one the page shows.)

import { useEffect, useState } from 'react'
import CityScene from './CityScene.jsx'
import SafeView from './SafeView.jsx'
import { BirdShout, Carried, CityEnd, CityNote, CitySky, DemonBubble, GroceryList, HourBar, IntroFlight, LawInscription, MuteButton, NorthArrow, Sleepers, StartScreen, TowerDisplay } from './CityHud.jsx'
import { city, press, resetCity, startCity } from './cityGame.js'

// Which way each key hops: one spot along the grid.
const KEYS = {
  ArrowUp: [0, -1],
  KeyW: [0, -1],
  ArrowDown: [0, 1],
  KeyS: [0, 1],
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
}

export default function CityApp() {
  // every new game rebuilds the city from scratch, behind the start screen
  const [round, setRound] = useState(0)
  // the shape you picked, flying from the start screen into the city: { shape, from }
  const [intro, setIntro] = useState(null)
  const start = (shape, from) => {
    startCity(shape)
    setIntro({ shape, from })
  }
  const backToStart = () => {
    resetCity()
    setRound((n) => n + 1)
  }

  useEffect(() => {
    const down = (e) => {
      if (city.phase === 'select') return
      if (!KEYS[e.code]) return
      e.preventDefault()
      press(...KEYS[e.code])
    }
    window.addEventListener('keydown', down)
    return () => window.removeEventListener('keydown', down)
  }, [])

  return (
    <div className="app city-app">
      <CitySky />
      <SafeView label="The city" className="broken-studio">
        <CityScene key={round} />
      </SafeView>
      <TowerDisplay />
      <LawInscription />
      <Carried />
      <BirdShout />
      <Sleepers />
      <DemonBubble />
      <HourBar />
      <GroceryList />
      <CityNote />
      <NorthArrow />
      <MuteButton />
      <StartScreen onPick={start} />
      {intro && <IntroFlight intro={intro} onDone={() => setIntro(null)} />}
      <CityEnd onAgain={backToStart} />
    </div>
  )
}
