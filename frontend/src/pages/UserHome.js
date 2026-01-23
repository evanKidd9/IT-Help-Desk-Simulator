// Home page for users
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function TicketCard({ t }) {
  const progressNum = Number(t?.progress);
  const progress = Number.isFinite(progressNum) ? progressNum : 0;

  return (
    <div style={{ border: "1px solid #ddd", padding: 12, marginBottom: 12,
        borderRadius: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.08)", background: "#fff"
      }}
    >
      <div>
        Name: <strong>{t.title}</strong>
      </div>

      <div style={{ marginTop: 6 }}>
        Status: <strong>{t.status}</strong>
      </div>

      <div style={{ marginTop: 6 }}>
        Priority: <strong>{t.priority}</strong>
      </div>

      <div style={{ marginTop: 10 }}>
        Progress: <strong>{progress}%</strong>
        <div style={{ height: 10, border: "1px solid #ccc", marginTop: 6,
            width: "100%", borderRadius: 999, overflow: "hidden", background: "#f3f3f3"
          }}
        >
          <div style={{ height: "100%", width: `${progress}%`, background: "#4caf50" }}/>
        </div>
      </div>
    </div>
  );
}

function UserHome() {
  const username = localStorage.getItem("username") || "user";
  const nav = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleteMsg, setDeleteMsg] = useState("");
  const [deleteErr, setDeleteErr] = useState("");
  const [deleting, setDeleting] = useState(false);

  function handleLogout() {
    setLoggingOut(true);

    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    setTimeout(() => {
        nav("/login");
    }, 900);
  }

  async function deleteAccount() {
  setDeleteErr("");
  setDeleteMsg("");

  if (deleteText.trim() !== "DELETE") {
    setDeleteErr(`All information associated with this account will be lost. If you still wish to
      proceed, please type "DELETE" to confirm.`);
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    setDeleteErr("Not logged in.");
    return;
  }

  setDeleting(true);

  try {
    const res = await fetch("http://127.0.0.1:5000/api/me", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ confirm: "DELETE" }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setDeleteErr(data.error || "Failed to delete account.");
      setDeleting(false);
      return;
    }

    setDeleteMsg("Account deleted. Redirecting to login...");
    // clear auth and redirect after a short pause
    setTimeout(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("username");
      localStorage.removeItem("user_id");
      window.location.href = "/login";
    }, 1000);
  } catch {
    setDeleteErr("Network error while deleting account.");
    setDeleting(false);
  }
}

  useEffect(() => {
    async function loadTickets() {
      setErr("");
      setLoading(true);

      const token = localStorage.getItem("token");
      if (!token) {
        setErr("Not logged in");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://127.0.0.1:5000/api/tickets/mine", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setErr(data.error || "Failed to load tickets");
          return;
        }

        setTickets(data.items || []);
      } catch {
        setErr("Network error. Flask server may not be running.");
      } finally {
        setLoading(false);
      }
    }

    loadTickets();
  }, []);

  return (
    <div style={{ padding: 24, background: "#fafafa", minHeight: "100vh" }}>
      <h1 style={{ textAlign: "center", marginTop: 0 }}>User Portal</h1>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        <div style={{ width: 450, border: "1px solid #ddd", padding: 12,
            borderRadius: 12, background: "#fff", position: "sticky", top: 16
          }}
        >
          <h2>Welcome, {username}</h2>

        <Link to="/user/submit-ticket">
          <button style={{
            width: "100%", padding: "10px 12px", borderRadius: 8, border: "none",
            background: "#1976d2", color: "#fff", cursor: "pointer", fontWeight: 600}}>
                Submit a new Ticket
          </button>
        </Link>

        <button onClick={handleLogout} style={{
            marginTop: 16, width: "100%", padding: "8px 12px", borderRadius: 8,
            border: "1px solid #ccc", background: "#f30f0f", cursor: "pointer", color: "#fff"
          }}>
            Logout
          </button>

          {loggingOut && (
            <p style={{ color: "green", textAlign: "center", marginTop: 8 }}>
                Logging out now...
            </p>
          )}

          {/* Delete account */}
          <button onClick={() => {
            setShowDelete((v) => !v);
            setDeleteErr("");
            setDeleteMsg("");
            setDeleteText("");
          }} style={{ marginTop: 12, width: "100%", padding: "8px 12px", borderRadius: 8,
            border: "1px solid #ccc", background: "#0008fa", color: "#fff",
            cursor: "pointer", fontWeight: 600
          }}>Delete Account</button>

          {showDelete && (
            <div style={{ marginTop: 12, padding: 10, border: "1px solid #f2c2c2", borderRadius: 10 }}>
              <p style={{marginTop: 0, color: "#b00020", fontWeight: 600 }}>
                Warning: This will permanently delete your account
              </p>
              <p style={{ marginTop: 0, opacity: 0.8 }}>
                Type <strong>DELETE</strong> to confirm deletion
              </p>

              <input value={deleteText} onChange={(e) => setDeleteText(e.target.value)}
                placeholder="Type 'DELETE'" 
                style={{ width: "100%", padding: 8, marginTop: 6 }}
                autoComplete="off" disabled={deleting}
              />

              {deleteErr && <p style={{ color: "crimson", marginTop: 8 }}>{deleteErr}</p>}
              {deleteMsg && <p style={{ color: "green", marginTop: 8 }}>{deleteMsg}</p>}

              <button onClick={deleteAccount} disabled={deleting} style={{
                marginTop: 10, width: "100%", padding: "10px 12px", borderRadius: 8,
                border: "none", background: "#b00020", color: "#fff", 
                cursor: "pointer", fontWeight: 600, opacity: deleting ? 0.7 : 1
              }}>{deleting ? "Deleting ..." : "Confirm deletion"}</button>
            </div>
          )}


          <p style={{ opacity: 0.8, fontSize: 17, marginTop: 12 }}>
            More functionality will be added here later
          </p>
        </div>

        <div style={{ flex: 1, border: "1px solid #ddd", borderRadius: 16,
            padding: 16, background: "#fff", boxShadow: "0 1px 8px rgba(0,0,0,0.06)"
          }}
        >
          <h2 style={{ marginTop: 0 }}>My Tickets</h2>

          {loading && <p>Loading ...</p>}
          {err && <p style={{ color: "crimson" }}>{err}</p>}

          {!loading && !err && tickets.length === 0 && (
            <p>You have no tickets yet! Submit one to get started!</p>
          )}

          {tickets.map((t) => (
            <TicketCard key={t.id} t={t} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default UserHome;
