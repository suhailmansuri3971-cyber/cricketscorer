import React, { useState, useEffect } from "react";
import SetupView from "./SetupView.jsx";
import ManagerView from "./ManagerView.jsx";
import AdminHome from "./AdminHome.jsx";
import ViewerView, { WatchCodeEntry } from "./ViewerView.jsx";

function parseHash() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  return hash.split("/").filter(Boolean); // e.g. ['manage','ABC123']
}

export default function App() {
  const [route, setRoute] = useState(parseHash());

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  let body;
  if (route[0] === "manage" && route[1]) {
    body = <ManagerView adminCode={route[1]} />;
  } else if (route[0] === "admin" && route[1] === "new") {
    body = <SetupView />;
  } else if (route[0] === "admin") {
    body = <AdminHome />;
  } else if (route[0] === "watch" && route[1]) {
    body = <ViewerView code={route[1]} />;
  } else if (route[0] === "watch") {
    body = <WatchCodeEntry />;
  } else {
    // Default landing: viewer-first, full screen. Admin is one small link away.
    body = <WatchCodeEntry />;
  }

  return <div className="shell">{body}</div>;
}
