import React, { useState, useEffect } from "react";

const BattlePage = ({ data, onFinish }) => {
  const [round, setRound] = useState(0);
  const [phaseStates, setPhaseStates] = useState([]);
  const [phaseDamageStats, setPhaseDamageStats] = useState([]);
  const [currentPhase, setCurrentPhase] = useState(-1);
  const [displayLogs, setDisplayLogs] = useState([]);

  const attackOrder = ["絳瓏棩", "𪄣瀛浠", "瑞泠鸘"];

  useEffect(() => {
    const initTeams = data.teams.map((team) => {
      const updatedTeam = {};
      Object.entries(team).forEach(([key, value]) => {
        if (typeof value === "object" && value.hp !== undefined) {
          updatedTeam[key] = { ...value, currentHp: value.hp };
        } else {
          updatedTeam[key] = value;
        }
      });
      return updatedTeam;
    });
    setPhaseStates([initTeams]);
    setPhaseDamageStats([{ ...Object.fromEntries(initTeams.map((t) => [t.name, 0])) }]);
  }, [data]);

  // 每條 log 慢慢顯示
  const showLogsOneByOne = (logs, phase, onFinish) => {
    setDisplayLogs([]);
    setCurrentPhase(phase);
    logs.forEach((log, idx) => {
      setTimeout(() => {
        setDisplayLogs((prev) => [...prev, log]);
        if (idx === logs.length - 1 && onFinish) {
          setTimeout(onFinish, 500); // 最後一條出完後稍等
        }
      }, idx * 500); // 每 0.5 秒顯示一條
    });
  };

  const allTeamsDead = (teams) => teams.every(team =>
    ["tank", "healer", "assassin", "mage"].every(roleKey => {
      const role = team[roleKey];
      return !role || role.currentHp <= 0;
    })
  );


  const runRound = () => {
    if (currentPhase !== -1) return;

    // 戰鬥結束判斷：超過10回合或有隊伍全滅
    if (round >= 10 || allTeamsDead(phaseStates[phaseStates.length - 1])) {
      const lastDamage = phaseDamageStats[phaseDamageStats.length - 1];
      const lastStates = phaseStates[phaseStates.length - 1];

      const totalHpPerTeam = {};
      const phaseLogsArray = [];

      lastStates.forEach(team => {
        let totalHp = 0;
        ["tank", "healer", "assassin", "mage"].forEach(roleKey => {
          const role = team[roleKey];
          if (role) {
            totalHp += role.currentHp;
          }
        });
        totalHpPerTeam[team.name] = totalHp;
      });

      const resultLogs = [];
      resultLogs.push(`戰鬥結算`);
      lastStates.forEach((team) => {
        resultLogs.push(`【${team.name}】`);
        resultLogs.push(`總傷害：${currentDamage[team.name]} ｜ 剩餘HP： ${totalHpPerTeam[team.name]}`);
        resultLogs.push(`總分：${currentDamage[team.name]+ totalHpPerTeam[team.name]}`)
      });
      
      setDisplayLogs(resultLogs);
    setIsRunning(false);
    onFinish && onFinish();
    return;

    }

    // === 藥水階段（第一回合特殊處理） ===
    if (round === 0) {
      const lastStates = JSON.parse(JSON.stringify(phaseStates[phaseStates.length - 1]));
      const lastDamage = { ...phaseDamageStats[phaseDamageStats.length - 1] };

      const prePotionLogs = ["💧 藥水攻擊階段"];
      lastStates.forEach((team) => {
        const dmg = Number(team.potion) || 0;
        if (dmg > 0) {
          lastDamage[team.name] += dmg;
          prePotionLogs.push(`💥 ${team.name} 的藥水造成蟻王 ${dmg} 點傷害！`);
        }
      });

      setPhaseStates([...phaseStates, lastStates]);
      setPhaseDamageStats([...phaseDamageStats, lastDamage]);

      showLogsOneByOne(prePotionLogs, 0, () => {
        setCurrentPhase(-1);
        setDisplayLogs([]);
        setRound((r) => r + 1);
      });

      return;
    }

    // === 後續回合 ===
    const newRound = round + 1;
    setRound(newRound);

    const lastStates = JSON.parse(JSON.stringify(phaseStates[phaseStates.length - 1]));
    const lastDamage = { ...phaseDamageStats[phaseDamageStats.length - 1] };

    const phaseLogsArray = [];
    const newPhaseStates = [];
    const newPhaseDamages = [];

    // 階段0：蟻王攻擊
    const phase0Logs = [];
    const atkPower = data.antAtk;

    phase0Logs.push(`🌀 第 ${newRound - 1} 回合開始！`);
    phase0Logs.push("🐜 蟻王攻擊！");

    lastStates.forEach((team) => {
      const tank = team.tank;
      if (tank.currentHp > 0) {
        const damage = atkPower * 2 - (tank.def || 0);
        if (damage > 0) {
          tank.currentHp = Math.max(0, tank.currentHp - damage);
          phase0Logs.push(`💥 ${team.name} 的 ${tank.roleLabel} 受到 ${damage} 傷害（會心一擊）`);
        } else {
          phase0Logs.push(`🛡 ${team.name} 的 ${tank.roleLabel} 防禦了會心一擊`);
        }
      } else {
        Object.entries(team).forEach(([roleKey, role]) => {
          if (typeof role === "object" && role.currentHp > 0 && role.hp !== undefined) {
            const damage = atkPower - (role.def || 0);
            if (damage > 0) {
              role.currentHp = Math.max(0, role.currentHp - damage);
              phase0Logs.push(`⚡ ${team.name} 的 ${role.roleLabel} 受到 ${damage} 傷害（全體攻擊）`);
            }
          }
        });
      }
    });

    phaseLogsArray.push(phase0Logs);
    newPhaseStates.push(lastStates);
    newPhaseDamages.push(lastDamage);

    // 階段1~3：各隊伍攻擊
    attackOrder.forEach((teamName) => {
      const prevStates = JSON.parse(JSON.stringify(newPhaseStates[newPhaseStates.length - 1]));
      const prevDamage = { ...newPhaseDamages[newPhaseDamages.length - 1] };

      const phaseLogs = [];
      const team = prevStates.find((t) => t.name === teamName);
      if (!team) {
        phaseLogs.push(`❌ 找不到隊伍 ${teamName}，跳過攻擊`);
        phaseLogsArray.push(phaseLogs);
        newPhaseStates.push(prevStates);
        newPhaseDamages.push(prevDamage);
        return;
      }

      // 🆕 全隊死亡判斷
      const allDead = ["tank", "healer", "assassin", "mage"].every(
        (roleKey) => !team[roleKey] || team[roleKey].currentHp <= 0
      );
      if (allDead) {
        phaseLogs.push(`💀 ${teamName} 全隊陣亡，跳過攻擊階段`);
        phaseLogsArray.push(phaseLogs);
        newPhaseStates.push(prevStates);
        newPhaseDamages.push(prevDamage);
        return;
      }

      phaseLogs.push(`⚔️ ${teamName} 攻擊開始！`);

      ["tank", "healer", "assassin", "mage"].forEach((roleKey) => {
        const role = team[roleKey];
        if (role && role.currentHp > 0) {
          const damage = role.atk || 0;
          prevDamage[team.name] += damage;
          phaseLogs.push(`🔥 ${teamName} 的 ${role.roleLabel} 對蟻王造成 【${damage}】 傷害`);

          if (role.heal && role.heal > 0) {
            if (roleKey === "healer") {
              let target = team.tank.currentHp > 0 ? team.tank : getRandomAlive(team);
              if (target) {
                target.currentHp = Math.min(target.hp, target.currentHp + role.heal);
                phaseLogs.push(`💖 ${teamName} 的 ${role.roleLabel} 治療了 ${target.roleLabel} ${role.heal} HP`);
              }
            } else {
              role.currentHp = Math.min(role.hp, role.currentHp + role.heal);
              phaseLogs.push(`💖 ${teamName} 的 ${role.roleLabel} 治療了自己 ${role.heal} HP`);
            }
          }
        }
      });

      phaseLogsArray.push(phaseLogs);
      newPhaseStates.push(prevStates);
      newPhaseDamages.push(prevDamage);
    });

    setPhaseStates(newPhaseStates);
    setPhaseDamageStats(newPhaseDamages);

    // 逐階段顯示
    let delay = 0;
    phaseLogsArray.forEach((logs, idx) => {
      setTimeout(() => {
        showLogsOneByOne(logs, idx, () => {
          if (idx === phaseLogsArray.length - 1) {
            setCurrentPhase(-1);
            setDisplayLogs([]);
          }
        });
      }, delay);
      delay += logs.length * 1000 + 1000;
    });


  };

  const getRandomAlive = (team) => {
    const alive = Object.values(team).filter(
      (role) => typeof role === "object" && role.hp !== undefined && role.currentHp > 0
    );
    return alive.length > 0 ? alive[Math.floor(Math.random() * alive.length)] : null;
  };

  const teamColors = ["#722323ff", "#767676ff", "#3ea9c3ff"];
  const cardColors = ["#ff8484ff", "#d3d3d3ff", "#96eaffff"];

  const currentStates =
    currentPhase === -1 ? phaseStates[phaseStates.length - 1] : phaseStates[currentPhase];
  const currentDamage =
    currentPhase === -1 ? phaseDamageStats[phaseDamageStats.length - 1] : phaseDamageStats[currentPhase];

  return (
    <div style={{ padding: "20px", background: "#222", color: "#fff" }}>
      {/* 隊伍狀態 */}
      <div style={{ display: "flex", gap: "20px" }}>
        {currentStates &&
          currentStates.map((team, i) => (
            <div
              key={i}
              style={{
                background: teamColors[i],
                padding: "10px",
                borderRadius: "8px",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <h1 style={{ fontSize: "2rem", margin: "10px 0", textAlign: "center" }}>{team.name}</h1>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  width: "100%",
                }}
              >
                {["tank", "healer", "assassin", "mage"].map((roleKey, idx) => {
                  const role = team[roleKey];
                  if (!role) return null;
                  return (
                    <div
                      key={idx}
                      style={{
                        background: role.currentHp > 0 ? cardColors[i] : "#000",
                        color: role.currentHp > 0 ? "black" : "white",
                        padding: "6px",
                        borderRadius: "6px",
                        opacity: role.currentHp > 0 ? 1 : 0.6,
                      }}
                    >
                      <p>
                        {role.name}（{role.roleLabel}）
                      </p>
                      <p>⚔️ ATK: {role.atk || 0}</p>
                      <p>🛡 DEF: {role.def || 0}</p>
                      <p>✨ HEAL: {role.heal || 0}</p>
                      <p>
                        ❤️ HP: {role.currentHp} / {role.hp}
                      </p>

                      <div
                        style={{
                          background: "#444",
                          height: "8px",
                          borderRadius: "4px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${(role.currentHp / role.hp) * 100}%`,
                            height: "100%",
                            background: "#b22222",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <h3 style={{ fontSize: "2rem", margin: "10px 0" }}>
                總傷害：{currentDamage ? currentDamage[team.name] : 0}
              </h3>
            </div>
          ))}
      </div>

      {/* 行動紀錄區 */}
      <div
        style={{
          marginTop: "20px",
          minHeight: "100px",
          background: "#333",
          borderRadius: "8px",
          padding: "10px",
          fontSize: "1.2rem",
          lineHeight: "1.4",
          whiteSpace: "pre-wrap",
        }}
      >
        {displayLogs &&
          displayLogs.map((log, i) => (
            <p
              key={i}
              style={{
                color:
                  currentPhase >= 1 && currentPhase <= 3 ? cardColors[currentPhase - 1] : "white",
              }}
            >
              {log}
            </p>
          ))}
      </div>

      <button
        onClick={runRound}
        disabled={currentPhase !== -1}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          fontSize: "1.5rem",
          borderRadius: "6px",
          backgroundColor: currentPhase === -1 ? "#4caf50" : "#777",
          color: "white",
          border: "none",
          cursor: currentPhase === -1 ? "pointer" : "not-allowed",
        }}
      >
        執行下一回合
      </button>
    </div>
  );
};

export default BattlePage;
