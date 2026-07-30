import React, { useState } from "react";
import { db, ref, set, matchPath, adminPath } from "./firebase.js";
import { uid, clone, newInnings } from "./gameLogic.js";

function TeamEditor({ label, list, onAdd, onRemove, value, onChange }) {
  return (
    <div>
      <label className="lbl">{label}</label>
      {list.map((p, i) => (
        <div key={p.id} className="playerEditRow">
          <span>{i + 1}. {p.name}</span>
          <button className="xbtn" onClick={() => onRemove(p.id)}>✕</button>
        </div>
      ))}
      <div className="rowbtns">
        <input
          className="input"
          placeholder={`Player ${list.length + 1} ka naam`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
        />
        <button className="btn ghost" onClick={onAdd}>+ Add</button>
      </div>
    </div>
  );
}

export default function SetupView() {
  const [teamAName, setTeamAName] = useState("");
  const [teamBName, setTeamBName] = useState("");
  const [teamA, setTeamA] = useState([]);
  const [teamB, setTeamB] = useState([]);
  const [overs, setOvers] = useState(6);
  const [tossWinner, setTossWinner] = useState("A");
  const [tossDecision, setTossDecision] = useState("bat");
  const [newPlayerName, setNewPlayerName] = useState({ A: "", B: "" });
  const [busy, setBusy] = useState(false);

  function addPlayer(teamKey) {
    const name = newPlayerName[teamKey].trim();
    const list = teamKey === "A" ? teamA : teamB;
    const setList = teamKey === "A" ? setTeamA : setTeamB;
    setList([...list, { id: uid(), name: name || `Player ${list.length + 1}`, out: false, dismissal: null }]);
    setNewPlayerName((s) => ({ ...s, [teamKey]: "" }));
  }
  function removePlayer(teamKey, id) {
    const setList = teamKey === "A" ? setTeamA : setTeamB;
    const list = teamKey === "A" ? teamA : teamB;
    setList(list.filter((p) => p.id !== id));
  }

  async function goLive() {
    if (teamA.length < 2 || teamB.length < 2) {
      alert("Kam se kam 2-2 players har team me chahiye.");
      return;
    }
    const battingKey = (tossWinner === "A") === (tossDecision === "bat") ? "teamA" : "teamB";
    const bowlingKey = battingKey === "teamA" ? "teamB" : "teamA";
    const code = uid();
    const adminCode = uid() + uid(); // longer + separate from the public code, kept secret
    const m = {
      code,
      config: {
        matchName: `${teamAName || "Team A"} vs ${teamBName || "Team B"}`,
        teamA: { name: teamAName || "Team A", players: clone(teamA) },
        teamB: { name: teamBName || "Team B", players: clone(teamB) },
        overs: Number(overs) || 6,
        toss: { winner: tossWinner, decision: tossDecision },
      },
      status: "openers1",
      currentInnings: 1,
      battingKey,
      bowlingKey,
      innings1: newInnings(battingKey, bowlingKey, Number(overs) || 6),
      innings2: null,
      target: null,
      result: null,
    };
    setBusy(true);
    try {
      await set(ref(db, matchPath(code)), m);
      await set(ref(db, adminPath(adminCode)), code);
      alert(
        "Match live ho gaya!\n\nYE TUMHARA ADMIN CODE HAI (isse tum kabhi bhi wapas is match par aa sakte ho, chahe tab band ho jaye):\n\n" +
        adminCode +
        "\n\nIse kahi safe jagah likh lo — screenshot le lo abhi!"
      );
      window.location.hash = `#/manage/${adminCode}`;
    } catch (e) {
      alert("Firebase se connect nahi ho paaya. firebase.js me apna config check karo. (" + e.message + ")");
    }
    setBusy(false);
  }

  return (
    <>
      <div className="header">
        <div className="eyebrow">GULLY CRICKET</div>
        <h1>Cricket Scorer</h1>
      </div>
      <div className="card">
        <label className="lbl">Team A naam</label>
        <input className="input" value={teamAName} onChange={(e) => setTeamAName(e.target.value)} placeholder="Team A" />
        <TeamEditor label="Team A players" list={teamA} onAdd={() => addPlayer("A")} onRemove={(id) => removePlayer("A", id)}
          value={newPlayerName.A} onChange={(v) => setNewPlayerName((s) => ({ ...s, A: v }))} />
      </div>
      <div className="card">
        <label className="lbl">Team B naam</label>
        <input className="input" value={teamBName} onChange={(e) => setTeamBName(e.target.value)} placeholder="Team B" />
        <TeamEditor label="Team B players" list={teamB} onAdd={() => addPlayer("B")} onRemove={(id) => removePlayer("B", id)}
          value={newPlayerName.B} onChange={(v) => setNewPlayerName((s) => ({ ...s, B: v }))} />
      </div>
      <div className="card">
        <label className="lbl">Overs</label>
        <input className="input" type="number" min="1" value={overs} onChange={(e) => setOvers(e.target.value)} />
        <label className="lbl">Toss jeeta</label>
        <div className="rowbtns">
          <button className={`chip ${tossWinner === "A" ? "chipActive" : ""}`} onClick={() => setTossWinner("A")}>{teamAName || "Team A"}</button>
          <button className={`chip ${tossWinner === "B" ? "chipActive" : ""}`} onClick={() => setTossWinner("B")}>{teamBName || "Team B"}</button>
        </div>
        <label className="lbl">Decision</label>
        <div className="rowbtns">
          <button className={`chip ${tossDecision === "bat" ? "chipActive" : ""}`} onClick={() => setTossDecision("bat")}>Batting</button>
          <button className={`chip ${tossDecision === "bowl" ? "chipActive" : ""}`} onClick={() => setTossDecision("bowl")}>Bowling</button>
        </div>
      </div>
      <button className="btn primary big" disabled={busy} onClick={goLive}>{busy ? "Starting..." : "Go Live 🔴"}</button>
      <div className="center" style={{ marginTop: 14 }}>
        <a className="linklike" href="#/watch">Match dekhna hai? Yaha code dalo →</a>
      </div>
    </>
  );
}
