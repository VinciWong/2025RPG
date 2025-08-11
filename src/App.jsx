import { useState } from "react"
import InputPage from "./components/InputPage"
import BattlePage from "./components/BattlePage"
import ResultPage from "./components/ResultPage"

function App() {
  const [stage, setStage] = useState("input")
  const [gameData, setGameData] = useState(null)

  const handleStart = (data) => {
    setGameData(data)
    setStage("battle")
  }

  const handleFinish = () => {
    setStage("result")
  }

  return (
    <div className="min-h-screen p-6">
      {stage === "input" && <InputPage onStart={handleStart} />}
      {stage === "battle" && <BattlePage data={gameData} onFinish={handleFinish} />}
      {stage === "result" && <ResultPage data={gameData} />}
    </div>
  )
}

export default App
