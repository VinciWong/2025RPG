export default function ResultPage({ data }) {
  const { team, potion } = data
  const chars = team
  const totalHP = Object.values(chars).reduce((sum, c) => sum + (c.hp > 0 ? c.hp : 0), 0)
  const totalDmg = Math.max(0, 1000 - (potion + Object.values(chars).reduce((sum, c) => sum + c.atk * 10, 0)))
  const score = totalHP + totalDmg

  return (
    <div className="text-center mt-10">
      <h2 className="text-3xl font-bold text-yellow-300">🏆 戰鬥結果</h2>
      <p className="mt-4">剩餘血量總和：{totalHP}</p>
      <p>對蟻王造成傷害：{totalDmg}</p>
      <p className="text-2xl font-semibold mt-4 text-green-300">
        總分：{score}
      </p>
    </div>
  )
}
