import React, { useState, useEffect, useRef } from "react";
import { db, ref, onValue, matchPath } from "./firebase.js";
import { fmtOvers } from "./gameLogic.js";
import Scoreboard from "./components/Scoreboard.jsx";
import AnimationOverlay from "./components/AnimationOverlay.jsx";

export function WatchCodeEntry() {
  const [code, setCode] = useState("");
  return (
    <div className="heroWrap">
      <div className="heroTop">
        <div className="heroBall">🏏</div>
        <div className="eyebrow">GULLY CRICKET</div>
        <h1 className="heroTitle">Cricket Scorer</h1>
        <p className="heroSub">Live score, live animation — code daalo aur dekho</p>
      </div>

      <div className="heroCard">
        <label className="lbl">Match Code</label>
        <input
          className="input codeInput heroInput"
          maxLength={10}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="A1B2C3"
          onKeyDown={(e) => e.key === "Enter" && code && (window.location.hash = `#/watch/${code}`)}
        />
        <button className="btn primary big" disabled={!code} onClick={() => (window.location.hash = `#/watch/${code}`)}>
          ▶ Live Dekho
        </button>
      </div>

      <a className="adminLink" href="#/admin">⚙ Match Manager / Admin</a>
    </div>
  );
}

export default function ViewerView({ code }) {
  const [match, setMatch] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [flash, setFlash] = useState(null);
  const lastEventId = useRef(null);

  useEffect(() => {
    const r = ref(db, matchPath(code));
    const unsub = onValue(r, (snap) => {
      const val = snap.val();
      if (val === null) setNotFound(true);
      else setMatch(val);
    });
    return () => unsub();
  }, [code]);

  useEffect(() => {
    if (!match) return;
    const inn = match.currentInnings === 1 ? match.innings1 : match.innings2;
    if (inn?.lastEvent && inn.lastEvent.id !== lastEventId.current) {
      lastEventId.current = inn.lastEvent.id;
      setFlash(inn.lastEvent);
      const t = setTimeout(() => setFlash(null), 1500);
      return () => clearTimeout(t);
    }
  }, [match]);

  if (notFound) {
    return (
      <div className="card center">
        <div className="eyebrow">NOT FOUND</div>
        <p>Ye match live nahi hai ya khatam ho chuka hai. Code check karo.</p>
        <a className="btn ghost" href="#/watch">← Wapas jao</a>
      </div>
    );
  }

  if (!match) return <div className="card center">Loading...</div>;

  if (["openers1", "openers2"].includes(match.status)) {
    return (
      <div className="card center">
        <div className="eyebrow">{match.config.matchName}</div>
        <p>Manager openers select kar raha hai... ek second ruko.</p>
      </div>
    );
  }

  if (match.status === "inningsBreak") {
    return (
      <div className="card center">
        <div className="eyebrow">INNINGS BREAK</div>
        <div className="bigscore">{match.innings1.runs}/{match.innings1.wickets}</div>
        <p>{match.config[match.battingKey].name} — {fmtOvers(match.innings1.balls)} overs</p>
        <p className="target">Target: {match.target}</p>
      </div>
    );
  }

  if (match.status === "completed") {
    return (
      <div className="card center">
        <div className="eyebrow">MATCH KHATAM</div>
        <h2>{match.result}</h2>
        <div className="summaryGrid">
          <div>
            <div className="teamName">{match.config[match.battingKey].name}</div>
            <div className="bigscore small">{match.innings1.runs}/{match.innings1.wickets} ({fmtOvers(match.innings1.balls)})</div>
          </div>
          <div>
            <div className="teamName">{match.config[match.bowlingKey].name}</div>
            <div className="bigscore small">{match.innings2.runs}/{match.innings2.wickets} ({fmtOvers(match.innings2.balls)})</div>
          </div>
        </div>
      </div>
    );
  }

  const teamKey = match.currentInnings === 1 ? match.battingKey : match.bowlingKey;
  const inn = match.currentInnings === 1 ? match.innings1 : match.innings2;

  return (
    <>
      <div className="topbar">
        <div className="matchName">{match.config.matchName}</div>
      </div>
      <Scoreboard match={match} inn={inn} teamKey={teamKey} />
      <AnimationOverlay event={flash} />
      <div className="card">
        <div className="eyebrow">Live Commentary</div>
        <div className="feed">
          {inn.events.slice(-10).reverse().map((e) => (
            <div key={e.id} className="feedRow">{e.label}</div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="eyebrow">Players — {match.config[teamKey].name}</div>
        <div className="players">
          {match.config[teamKey].players.map((p) => (
            <div key={p.id} className={`playerRow ${p.out ? "out" : ""} ${p.id === inn.strikerId || p.id === inn.nonStrikerId ? "batting" : ""}`}>
              {p.name}{p.id === inn.strikerId ? " 🏏" : ""}{p.out ? ` — out (${p.dismissal})` : ""}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
