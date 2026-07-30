import React from "react";
import { fmtOvers } from "../gameLogic.js";

export default function Scoreboard({ match, inn, teamKey }) {
  const battingName = match.config[teamKey].name;
  const strikerName = match.config[teamKey].players.find((p) => p.id === inn.strikerId)?.name || "-";
  const nonStrikerName = match.config[teamKey].players.find((p) => p.id === inn.nonStrikerId)?.name || "-";

  return (
    <div className="scorecard">
      <div className="teamRow">
        <span className="teamName">{battingName}</span>
        <span className="overs">Ov {fmtOvers(inn.balls)} / {match.config.overs}</span>
      </div>
      <div className="ledscore">
        {inn.runs}
        <span className="slash">/</span>
        {inn.wickets}
      </div>
      {match.currentInnings === 2 && (
        <div className="target">
          Target: {match.target} · Chahiye: {Math.max(match.target - inn.runs, 0)} runs
        </div>
      )}
      <div className="batsmen">
        <span>🏏 {strikerName}*</span>
        <span>{nonStrikerName}</span>
      </div>
    </div>
  );
}
