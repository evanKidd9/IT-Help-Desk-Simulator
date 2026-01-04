import { useEffect, useState } from "react";

function App() {
  const [status, setStatus] = useState ("loading...");

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/health")
      .then((r) => r.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Help Desk Simulator</h1>
      <p>Backend status: {status}</p>
    </div>
  );
}

export default App;