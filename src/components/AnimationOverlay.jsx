import React from "react";

function Confetti({ count = 18 }) {
  const colors = ["#FFB020", "#3FAE5B", "#3E6FD9", "#C1392B", "#F2F0EA"];
  const pieces = Array.from({ length: count });
  return (
    <div className="confettiWrap">
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.25;
        const duration = 0.9 + Math.random() * 0.7;
        const rot = Math.random() * 360;
        const color = colors[i % colors.length];
        return (
          <span
            key={i}
            className="confetti"
            style={{
              left: `${left}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              background: color,
              transform: `rotate(${rot}deg)`,
            }}
          />
        );
      })}
    </div>
  );
}

/** event: { kind: 'six'|'four'|'out'|'wide'|'noball'|'bye'|'legbye'|'normal', label } */
export default function AnimationOverlay({ event }) {
  if (!event) return null;

  if (event.kind === "six") {
    return (
      <div className="overlayLayer">
        <Confetti count={22} />
        <div className="flyball">🏏</div>
        <div className="eventText3d text-six">SIX!</div>
      </div>
    );
  }
  if (event.kind === "four") {
    return (
      <div className="overlayLayer">
        <Confetti count={10} />
        <div className="zoomball">🏏</div>
        <div className="eventText3d text-four">FOUR!</div>
      </div>
    );
  }
  if (event.kind === "out") {
    return (
      <div className="overlayLayer shakeScreen">
        <div className="bail">🎯</div>
        <div className="eventText3d text-out">OUT!</div>
      </div>
    );
  }
  if (event.kind === "wide" || event.kind === "noball") {
    return (
      <div className="toastBanner">{event.kind === "wide" ? "Wide ball" : "No Ball — Free Hit next!"}</div>
    );
  }
  return null;
}
