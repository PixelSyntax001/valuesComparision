import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import DamageCalculator from './DamageCalculator'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <DamageCalculator />
    </>
  )
}

export default App
