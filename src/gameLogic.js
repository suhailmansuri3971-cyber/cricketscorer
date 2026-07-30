// Pure functions only - no Firebase, no React. Easy to unit-test and reason about.

export const uid = () => Math.random().toString(36).slice(2, 8).toUpperCase();
export const clone = (o) => JSON.parse(JSON.stringify(o));
export const fmtOvers = (balls) => `${Math.floor(balls / 6)}.${balls % 6}`;

export function newInnings(battingTeam, bowlingTeam, oversLimit) {
  return {
    battingTeam,
    bowlingTeam,
    runs: 0,
    wickets: 0,
    balls: 0,
    extras: { wide: 0, noball: 0, bye: 0, legbye: 0 },
    strikerId: null,
    nonStrikerId: null,
    freeHit: false,
    events: [],
    lastEvent: null,
  };
}

export function totalPlayers(match, teamKey) {
  return match.config[teamKey].players.length;
}

function swapStrike(inn) {
  const t = inn.strikerId;
  inn.strikerId = inn.nonStrikerId;
  inn.nonStrikerId = t;
}

/**
 * Apply one delivery. kind: 'normal' | 'wide' | 'noball' | 'bye' | 'legbye'
 * runs: for 'normal' -> 0/1/2/3/4/6 scored by bat
 *       for 'wide'/'noball' -> extra runs run by batsmen ON TOP of the 1-run penalty
 *       for 'bye'/'legbye' -> runs completed
 */
export function applyDelivery(match, inn, teamKey, { kind, runs }) {
  let legalBall = true;
  let strikeSwapRuns = 0;
  let label = "";

  if (kind === "normal") {
    inn.runs += runs;
    strikeSwapRuns = runs;
    label = runs === 6 ? "SIX!" : runs === 4 ? "FOUR!" : runs === 0 ? "Dot ball" : `${runs} run${runs === 1 ? "" : "s"}`;
  } else if (kind === "bye") {
    inn.runs += runs;
    inn.extras.bye += runs;
    strikeSwapRuns = runs;
    label = `${runs} bye${runs === 1 ? "" : "s"}`;
  } else if (kind === "legbye") {
    inn.runs += runs;
    inn.extras.legbye += runs;
    strikeSwapRuns = runs;
    label = `${runs} leg bye${runs === 1 ? "" : "s"}`;
  } else if (kind === "wide") {
    legalBall = false;
    inn.runs += 1 + runs;
    inn.extras.wide += 1 + runs;
    strikeSwapRuns = runs;
    label = runs > 0 ? `Wide +${runs}` : "Wide";
  } else if (kind === "noball") {
    legalBall = false;
    inn.runs += 1 + runs;
    inn.extras.noball += 1;
    strikeSwapRuns = runs;
    label = runs > 0 ? `No ball +${runs}` : "No ball";
  }

  if (legalBall) inn.balls += 1;

  // Free-hit rule: a no-ball grants a free hit on the very next delivery.
  // A wide neither consumes nor grants one. Any other delivery consumes it.
  if (kind === "noball") inn.freeHit = true;
  else if (kind !== "wide") inn.freeHit = false;

  if (strikeSwapRuns % 2 === 1) swapStrike(inn);
  if (legalBall && inn.balls > 0 && inn.balls % 6 === 0) swapStrike(inn); // end of over

  inn.lastEvent = { id: uid(), label, kind: runs === 6 ? "six" : runs === 4 ? "four" : kind === "normal" ? "normal" : kind };
  inn.events.push(inn.lastEvent);
  return inn;
}

export function applyWicket(match, inn, teamKey, { runsBeforeOut, dismissedSlot, howOut, newBatsmanId }) {
  inn.runs += runsBeforeOut;
  inn.balls += 1;
  inn.wickets += 1;
  inn.freeHit = false;

  const outPlayerId = dismissedSlot === "striker" ? inn.strikerId : inn.nonStrikerId;
  const team = match.config[teamKey].players;
  const p = team.find((pl) => pl.id === outPlayerId);
  if (p) {
    p.out = true;
    p.dismissal = howOut;
  }

  if (dismissedSlot === "striker") inn.strikerId = newBatsmanId;
  else inn.nonStrikerId = newBatsmanId;

  if (runsBeforeOut % 2 === 1) swapStrike(inn);
  if (inn.balls > 0 && inn.balls % 6 === 0) swapStrike(inn);

  inn.lastEvent = { id: uid(), label: `OUT (${howOut})`, kind: "out" };
  inn.events.push(inn.lastEvent);
  return inn;
}

export function inningsShouldEnd(match, inn, teamKey) {
  if (inn.wickets >= totalPlayers(match, teamKey) - 1) return "all_out";
  if (inn.balls >= match.config.overs * 6) return "overs_done";
  if (match.currentInnings === 2 && inn.runs >= match.target) return "target_reached";
  return null;
}

export function computeResult(m) {
  const chased = m.innings2.runs;
  const target = m.target;
  const battingTeam2Key = m.bowlingKey; // team batting 2nd is the innings-1 bowling side
  const wicketsLeft = totalPlayers(m, battingTeam2Key) - 1 - m.innings2.wickets;
  if (chased >= target) {
    return `${m.config[battingTeam2Key].name} jeet gayi, ${wicketsLeft} wicket${wicketsLeft === 1 ? "" : "s"} se.`;
  } else if (chased === target - 1) {
    return "Match TIE ho gaya!";
  } else {
    const margin = target - 1 - chased;
    return `${m.config[m.battingKey].name} jeet gayi, ${margin} run${margin === 1 ? "" : "s"} se.`;
  }
}
