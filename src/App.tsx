import { useState } from 'react'
import type { TierId } from './config'
import Stage from './components/Stage'
import { createGame } from './engine/engine'
import type { GameState } from './engine/types'
import EndScreen from './screens/EndScreen'
import GameScreen from './screens/GameScreen'
import LandingScreen from './screens/LandingScreen'
import StartScreen from './screens/StartScreen'

export default function App() {
  const [game, setGame] = useState<GameState | null>(null)
  const [screen, setScreen] = useState<'landing' | 'selection'>('landing')
  const start = (tierId: TierId) => setGame(createGame(tierId))

  return (
    <Stage>
      {game ? (
        game.phase === 'ended' ? (
          <EndScreen game={game} onReplay={() => { setGame(null); setScreen('landing') }} />
        ) : (
          <GameScreen game={game} onChange={setGame} />
        )
      ) : screen === 'landing' ? (
        <LandingScreen onPlay={() => setScreen('selection')} />
      ) : (
        <StartScreen onStart={start} onBack={() => setScreen('landing')} />
      )}
    </Stage>
  )
}
