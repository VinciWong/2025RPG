import { useState } from "react"

export default function InputPage({ onStart }) {
  const empty = (roleLabel) => ({ roleLabel, atk: "", def: "", heal: "", hp: "" })

  const [antAtk, setAntAtk] = useState("")

  const [teams, setTeams] = useState([
    { name: "絳瓏棩", potion: "", tank: empty("坦克"), healer: empty("牧師"), assassin: empty("刺客"), mage: empty("魔法師") },
    { name: "𪄣瀛浠", potion: "", tank: empty("坦克"), healer: empty("牧師"), assassin: empty("刺客"), mage: empty("魔法師") },
    { name: "瑞泠鸘", potion: "", tank: empty("坦克"), healer: empty("牧師"), assassin: empty("刺客"), mage: empty("魔法師") }
  ])

  const update = (teamIndex, role, key, val) => {
    setTeams((prev) => {
      const copy = [...prev]
      copy[teamIndex] = {
        ...copy[teamIndex], 
        [role]: {
          ...copy[teamIndex][role],
          [key]: Number(val)
        }
      }
      return copy
    })
  }

  const updatePotion = (teamIndex, val) => {
    setTeams((prev) => {
      const copy = [...prev]
      copy[teamIndex].potion = Number(val)
      return copy
    })
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-yellow-400">蟻王攻略戰</h1>
      <div className="space-y-4 mb-6">
        <div>
          <label>
            蟻王攻擊力：
            <input
              type="number"
              value={antAtk}
              onChange={(e) => setAntAtk(e.target.value)}
              className="text-black ml-2"
            />
          </label>
        </div>
      </div>

      {teams.map((team, teamIndex) => {
        const bgColors = ["bg-red-800", "bg-gray-800", "bg-blue-800"]
        // 先排除掉 name 和 potion，取得角色 key 清單
        const roleKeys = Object.keys(team).filter(k => !["name", "potion"].includes(k))

        return (
          <div
            key={team.name}
            className={`p-4 border rounded mb-3 ${bgColors[teamIndex]}`}
          >
            <h2 className="text-xl font-bold mb-2 text-white">{team.name}</h2>

            <div className="mb-3">
              <label className="text-white">
                通用藥水攻擊：
                <input
                  type="number"
                  value={team.potion}
                  onChange={(e) => updatePotion(teamIndex, e.target.value)}
                  className="text-black ml-2"
                />
              </label>
            </div>

            {roleKeys.map((roleKey) => (
              <div key={roleKey} className="mb-2">
                <h3 className="text-white">{team[roleKey].roleLabel}</h3>
                <div className="grid grid-cols-4 gap-2">
                  {["atk", "def", "heal", "hp"].map((stat) => (
                    <input
                      key={stat}
                      type="number"
                      placeholder={stat}
                      value={team[roleKey][stat]}
                      onChange={(e) => update(teamIndex, roleKey, stat, e.target.value)}
                      className="text-black px-1"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      })}


      <button
        onClick={() => onStart({ antAtk: Number(antAtk), teams })}
        className="bg-blue-500 hover:bg-blue-700 px-4 py-2 rounded"
      >
        遊戲開始
      </button>
    </div>
  )
}
