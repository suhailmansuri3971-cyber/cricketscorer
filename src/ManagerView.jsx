import React, { useState, useEffect, useRef } from "react";
import { db, ref, onValue, set, remove, matchPath, adminPath } from "./firebase.js";
import {
  clone, fmtOvers, applyDelivery, applyWicket, inningsShouldEnd, computeResult, newInnings,
} from "./gameLogic.js";
import Scoreboard from "./components/Scoreboard.jsx";
import AnimationOverlay from "./components/AnimationOverlay.jsx";

// adminCode -> resolves to the real (public) match code -> then everything
// works exactly like before, keyed on the real code.
export default function ManagerView({ adminCode }) {
  const [realCode, setRealCode] = useState(undefined); // undefined = loading, null = not found
  const [match, setMatch] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const historyRef = useRef([]);
  const [historyLen, setHistoryLen] = useState(0);
  const [flash, setFlash] = useState(null);
  const [showPlayers, setShowPlayers] = useState(false);
  const [extraMenu, setExtraMenu] = useState(null);
  const [outOpen, setOutOpen] = useState(false);
  const [outRuns, setOutRuns] = useState(0);
  const [outSlot, setOutSlot] = useState("striker");
  const [outHow, setOutHow] = useState("bowled");
  const [newBatId, setNewBatId] = useState("");
  const lastEventId = useRef(null);

  // Step 1: resolve admin code -> real match code
  useEffect(() => {
    const r = ref(db, adminPath(adminCode));
    const unsub = onValue(r, (snap) => setRealCode(snap.val() || null));
    return () => unsub();
  }, [adminCode]);

  // Step 2: subscribe to the actual match (keeps this tab in sync even after reload)
  useEffect(() => {
    if (!realCode) return;
    const r = ref(db, matchPath(realCode));
    const unsub = onValue(r, (snap) => setMatch(snap.val()));
    return () => unsub();
  }, [realCode]);

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

  if (realCode === null) {
    return (
      <div className="card center">
        <div className="eyebrow">NOT FOUND</div>
        <p>Ye admin code invalid hai ya match already khatam ho chuka hai.</p>
        <a className="btn ghost" href="#/admin">← Wapas jao</a>
      </div>
    );
  }
  if (realCode === undefined || !match) {
    return <div className="card center">Match load ho raha hai...</div>;
  }

  // Push new state: update THIS screen instantly (optimistic), then sync to Firebase.
  // Fixes the "taps don't seem to do anything" bug — the UI no longer waits on
  // a network round-trip to show the new score.
  function push(m) {
    historyRef.current = [...historyRef.current.slice(-25), match];
    setHistoryLen(historyRef.current.length);
    setMatch(m);
    setSaveError(null);
    set(ref(db, matchPath(realCode)), m).catch((e) => {
      setSaveError("Save fail hua (" + e.message + "). Database Rules check karo — README ka Step 4 dekho.");
    });
  }

  function undo() {
    const prev = historyRef.current.pop();
    setHistoryLen(historyRef.current.length);
    if (prev) {
      setMatch(prev);
      set(ref(db, matchPath(realCode)), prev).catch((e) => setSaveError("Save fail hua (" + e.message + ")."));
    }
  }

  const currentInnKey = () => (match.currentInnings === 1 ? "innings1" : "innings2");
  const currentTeamKey = () => (match.currentInnings === 1 ? match.battingKey : match.bowlingKey);

  function finalize(m, key, teamKey) {
    const endReason = inningsShouldEnd(m, m[key], teamKey);
    if (endReason) {
      if (m.currentInnings === 1) {
        m.target = m[key].runs + 1;
        m.status = "inningsBreak";
      } else {
        m.status = "completed";
        m.result = computeResult(m);
      }
    }
    push(m);
  }

  function doDelivery(kind, runs) {
    const m = clone(match);
    const key = m.currentInnings === 1 ? "innings1" : "innings2";
    const teamKey = m.currentInnings === 1 ? m.battingKey : m.bowlingKey;
    applyDelivery(m, m[key], teamKey, { kind, runs });
    finalize(m, key, teamKey);
  }

  function benchPlayers() {
    const teamKey = currentTeamKey();
    const inn = match[currentInnKey()];
    return match.config[teamKey].players.filter((p) => !p.out && p.id !== inn.strikerId && p.id !== inn.nonStrikerId);
  }

  function openOutModal() {
    const inn = match[currentInnKey()];
    setOutRuns(0);
    setOutSlot("striker");
    setOutHow(inn.freeHit ? "run out" : "bowled");
    setNewBatId("");
    setOutOpen(true);
  }

  function submitOut() {
    const key = currentInnKey();
    const teamKey = currentTeamKey();
    const inn = match[key];
    if (inn.freeHit && outHow !== "run out") {
      alert("Free hit par sirf run out allowed hai.");
      return;
    }
    if (!newBatId) {
      alert("Naya batsman chuno.");
      return;
    }
    const m = clone(match);
    applyWicket(m, m[key], teamKey, {
      runsBeforeOut: Number(outRuns),
      dismissedSlot: outSlot,
      howOut: outHow,
      newBatsmanId: newBatId,
    });
    setOutOpen(false);
    finalize(m, key, teamKey);
  }

  function startSecondInnings() {
    const m = clone(match);
    m.currentInnings = 2;
    m.innings2 = newInnings(m.bowlingKey, m.battingKey, m.config.overs);
    m.status = "openers2";
    push(m);
  }

  function confirmOpeners(strikerId, nonStrikerId) {
    const m = clone(match);
    const inn = m.currentInnings === 1 ? m.innings1 : m.innings2;
    inn.strikerId = strikerId;
    inn.nonStrikerId = nonStrikerId;
    m.status = "live";
    push(m);
  }

  function shareMatch() {
    const url = `${window.location.origin}${window.location.pathname}#/watch/${realCode}`;
    const text = `🏏 Cricket Scorer LIVE! Code: ${realCode}\nDekho: ${url}`;
    if (navigator.share) navigator.share({ text, url });
    else {
      navigator.clipboard?.writeText(text);
      alert("Link copy ho gaya:\n" + text);
    }
  }

  function shareAdminLink() {
    const url = `${window.location.origin}${window.location.pathname}#/manage/${adminCode}`;
    navigator.clipboard?.writeText(url);
    alert("Apna Admin link copy ho gaya — isse tum kabhi bhi wapas isi match par aa sakte ho (khud ke paas rakho, kisi aur ko mat do):\n" + url);
  }

  async function endLiveAndClear() {
    if (confirm("Live band karke is match ka data permanently delete karein?")) {
      await remove(ref(db, matchPath(realCode)));
      await remove(ref(db, adminPath(adminCode)));
      window.location.hash = "#/";
    }
  }

  const ErrorBanner = saveError ? <div className="errorBanner">{saveError}</div> : null;

  if (match.status === "openers1" || match.status === "openers2") {
    const battingTeamKey = match.currentInnings === 1 ? match.battingKey : match.bowlingKey;
    const players = match.config[battingTeamKey].players.filter((p) => !p.out);
    return (
      <>
        <TopBar match={match} onShare={shareMatch} onShareAdmin={shareAdminLink} />
        {ErrorBanner}
        <div className="card">
          <h3>Openers chuno — {match.config[battingTeamKey].name}</h3>
          <OpenerForm players={players} onDone={confirmOpeners} />
        </div>
      </>
    );
  }

  if (match.status === "inningsBreak") {
    return (
      <>
        <TopBar match={match} onShare={shareMatch} onShareAdmin={shareAdminLink} />
        {ErrorBanner}
        <div className="card center">
          <div className="eyebrow">INNINGS BREAK</div>
          <div className="bigscore">{match.innings1.runs}/{match.innings1.wickets}</div>
          <p>{match.config[match.battingKey].name} ne {fmtOvers(match.innings1.balls)} overs me {match.innings1.runs} banaye.</p>
          <p className="target">{match.config[match.bowlingKey].name} ko jeetne ke liye chahiye: <b>{match.target}</b></p>
          <button className="btn primary big" onClick={startSecondInnings}>Doosri Innings Shuru Karo</button>
        </div>
      </>
    );
  }

  if (match.status === "completed") {
    return (
      <>
        <TopBar match={match} onShare={shareMatch} onShareAdmin={shareAdminLink} />
        {ErrorBanner}
        <div className="card center printable">
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
          <div className="noprint rowbtns">
            <button className="btn primary" onClick={() => window.print()}>📄 Summary Download</button>
            <button className="btn danger" onClick={endLiveAndClear}>End Live &amp; Clear</button>
          </div>
        </div>
      </>
    );
  }

  const key = currentInnKey();
  const teamKey = currentTeamKey();
  const inn = match[key];

  return (
    <>
      <TopBar match={match} onShare={shareMatch} onShareAdmin={shareAdminLink} />
      {ErrorBanner}
      <div className="stickyTop">
        <Scoreboard match={match} inn={inn} teamKey={teamKey} />
      </div>

      <AnimationOverlay event={flash} />

      {inn.freeHit && <div className="freehit">⚡ FREE HIT — sirf run out ho sakta hai</div>}

      <div className="keypad">
        <div className="grid6">
          {[0, 1, 2, 3, 4, 6].map((r) => (
            <button key={r} className={`ballbtn ${r === 4 ? "four" : r === 6 ? "six" : ""}`} onClick={() => doDelivery("normal", r)}>{r}</button>
          ))}
        </div>

        <div className="grid4 extrasRow">
          <button className={`chip ${extraMenu === "wide" ? "chipActive" : ""}`} onClick={() => setExtraMenu(extraMenu === "wide" ? null : "wide")}>Wide</button>
          <button className={`chip ${extraMenu === "noball" ? "chipActive" : ""}`} onClick={() => setExtraMenu(extraMenu === "noball" ? null : "noball")}>No Ball</button>
          <button className={`chip ${extraMenu === "bye" ? "chipActive" : ""}`} onClick={() => setExtraMenu(extraMenu === "bye" ? null : "bye")}>Bye</button>
          <button className={`chip ${extraMenu === "legbye" ? "chipActive" : ""}`} onClick={() => setExtraMenu(extraMenu === "legbye" ? null : "legbye")}>Leg Bye</button>
        </div>

        {extraMenu && (
          <div className="submenu">
            <span className="lbl">{extraMenu === "noball" ? "No ball — bat se kitne runs" : "Kitne runs"}</span>
            <div className="rowbtns">
              {(extraMenu === "noball" ? [0, 1, 2, 3, 4, 6] : [0, 1, 2, 3, 4]).map((r) => (
                <button key={r} className="chip small" onClick={() => { doDelivery(extraMenu, r); setExtraMenu(null); }}>{r}</button>
              ))}
            </div>
          </div>
        )}

        <div className="rowbtns bigActionsRow">
          <button className="btn danger big" onClick={openOutModal}>OUT</button>
          <button className="btn ghost big" onClick={undo} disabled={!historyLen}>↩ Undo</button>
        </div>
      </div>

      <button className="collapseBtn" onClick={() => setShowPlayers((s) => !s)}>
        {showPlayers ? "▲ Players chhupao" : "▼ Players dikhao"}
      </button>
      {showPlayers && <PlayerList match={match} teamKey={teamKey} inn={inn} />}

      {outOpen && (
        <div className="modalBg">
          <div className="modal">
            <h3>Wicket Details</h3>
            <label className="lbl">Kaun out hua?</label>
            <div className="rowbtns">
              <button className={`chip ${outSlot === "striker" ? "chipActive" : ""}`} onClick={() => setOutSlot("striker")}>
                {match.config[teamKey].players.find((p) => p.id === inn.strikerId)?.name} (striker)
              </button>
              <button className={`chip ${outSlot === "non" ? "chipActive" : ""}`} onClick={() => setOutSlot("non")}>
                {match.config[teamKey].players.find((p) => p.id === inn.nonStrikerId)?.name} (non-striker)
              </button>
            </div>
            <label className="lbl">Kaise out hua</label>
            <select className="select" value={outHow} onChange={(e) => setOutHow(e.target.value)}>
              <option value="bowled">Bowled</option>
              <option value="caught">Caught</option>
              <option value="run out">Run Out</option>
              <option value="stumped">Stumped</option>
              <option value="hit wicket">Hit Wicket</option>
            </select>
            <label className="lbl">Out hone se pehle kitne run bhaage</label>
            <div className="rowbtns">
              {[0, 1, 2, 3].map((r) => (
                <button key={r} className={`chip small ${outRuns === r ? "chipActive" : ""}`} onClick={() => setOutRuns(r)}>{r}</button>
              ))}
            </div>
            <label className="lbl">Naya batsman</label>
            <select className="select" value={newBatId} onChange={(e) => setNewBatId(e.target.value)}>
              <option value="">-- chuno --</option>
              {benchPlayers().map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="rowbtns" style={{ marginTop: 14 }}>
              <button className="btn ghost" onClick={() => setOutOpen(false)}>Cancel</button>
              <button className="btn danger" onClick={submitOut}>Confirm Out</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function OpenerForm({ players, onDone }) {
  const [s, setS] = useState(players[0]?.id || "");
  const [ns, setNs] = useState(players[1]?.id || "");
  return (
    <>
      <label className="lbl">Striker</label>
      <select className="select" value={s} onChange={(e) => setS(e.target.value)}>
        {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <label className="lbl">Non-striker</label>
      <select className="select" value={ns} onChange={(e) => setNs(e.target.value)}>
        {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <button className="btn primary big" disabled={!s || !ns || s === ns} onClick={() => onDone(s, ns)}>Shuru Karo</button>
      {s === ns && <p className="warn">Dono alag players hone chahiye.</p>}
    </>
  );
}

function TopBar({ match, onShare, onShareAdmin }) {
  return (
    <div className="topbar">
      <div>
        <div className="matchName">{match.config.matchName}</div>
        <div className="code">CODE: <b>{match.code}</b></div>
      </div>
      <div className="rowbtns" style={{ gap: 6 }}>
        <button className="btn ghost small" onClick={onShareAdmin} title="Apna resume-link save karo">🔑 Admin link</button>
        <button className="btn ghost small" onClick={onShare}>Share</button>
      </div>
    </div>
  );
}

function PlayerList({ match, teamKey, inn }) {
  const players = match.config[teamKey].players;
  return (
    <div className="card">
      <div className="eyebrow">Players — {match.config[teamKey].name}</div>
      <div className="players">
        {players.map((p) => (
          <div key={p.id} className={`playerRow ${p.out ? "out" : ""} ${p.id === inn.strikerId || p.id === inn.nonStrikerId ? "batting" : ""}`}>
            {p.name}{p.id === inn.strikerId ? " 🏏" : ""}{p.out ? ` — out (${p.dismissal})` : ""}
          </div>
        ))}
      </div>
    </div>
  );
}
