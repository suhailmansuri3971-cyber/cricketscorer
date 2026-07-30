import React, { useState } from "react";

export default function AdminHome() {
  const [adminCode, setAdminCode] = useState("");

  return (
    <div>
      <div className="header">
        <div className="eyebrow">MATCH MANAGER</div>
        <h1>Admin</h1>
      </div>

      <div className="card">
        <h3>Naya match shuru karo</h3>
        <p className="hint">Team, players, overs set karke live jao.</p>
        <a className="btn primary big" href="#/admin/new">+ Naya Match</a>
      </div>

      <div className="card">
        <h3>Pehle se chal raha match resume karo</h3>
        <p className="hint">Agar tab band ho gaya tha ya app se hat gaye the, apna Admin Code yaha daalo.</p>
        <input
          className="input codeInput"
          placeholder="Admin code"
          value={adminCode}
          onChange={(e) => setAdminCode(e.target.value.trim())}
        />
        <button
          className="btn primary big"
          disabled={!adminCode}
          onClick={() => (window.location.hash = `#/manage/${adminCode}`)}
        >
          Resume Karo
        </button>
      </div>

      <div className="center" style={{ marginTop: 10 }}>
        <a className="linklike" href="#/">← Viewer screen par wapas jao</a>
      </div>
    </div>
  );
}
