import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function TechHome() {
    const nav = useNavigate();
    const username = localStorage.getItem("username") || "tech";
    const myId = Number(localStorage.getItem("user_id"));

    const [items, setItems] = useState([]);
    const [err, setErr] = useState("");
    const [ticketMsg, setTicketMsg] = useState({});
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);
    const [expanded, setExpanded] = useState(() => new Set());

    const [showDelete, setShowDelete] = useState(false);
    const [deleteText, setDeleteText] = useState("");
    const [deleteMsg, setDeleteMsg] = useState("");
    const [deleteErr, setDeleteErr] = useState("");
    const [deleting, setDeleting] = useState(false);

    async function loadTickets() {
        setErr("");
        setLoading(true);

        const token = localStorage.getItem("token");
        if (!token) {
            setErr("Not logged in.");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("http://127.0.0.1:5000/api/tech/tickets", {
            headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setErr(data.error || "Failed to load tickets.");
                return;
            }
        setItems(data.items || []);
        } catch {
            setErr("Network error. Is Flask running?");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadTickets();
    }, []);

    function handleLogout() {
        setLoggingOut(true);
        setErr("");
        setTicketMsg({});

        setTimeout(() => {
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            localStorage.removeItem("username");
            localStorage.removeItem("user_id");
            nav("/login");
        }, 800);
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

    function showTicketMsg(ticketId, text, ms = 1500) {
        setTicketMsg((prev) => ({ ...prev, [ticketId]: text }));

        setTimeout(() => {
            setTicketMsg((prev) => {
            const copy = { ...prev };
            delete copy[ticketId];
            return copy;
          });
        }, ms);
    }

    function showDetails(ticketId) {
      setExpanded((prev) => {
        const next = new Set(prev);
        next.add(ticketId);
        return next;
      });
    }

    function hideDetails(ticketId) {
      setExpanded((prev) => {
        const next = new Set(prev);
        next.delete(ticketId);
        return next;
      });
    }

    async function assignToMe(ticketId) {
        setErr("");
        const token = localStorage.getItem("token");

        try {
            const res = await fetch( `http://127.0.0.1:5000/api/tech/tickets/${ticketId}/assign`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setErr(data.error || "Failed to assign ticket.");
                return;
            }

            await loadTickets();
            showTicketMsg(ticketId, "Assigned to ticket! Don't let the customer down!!");
        } catch {
            setErr("Network error while assigning ticket.");
        }
    }

    async function updateTicket(ticketId, patch) {
        setErr("");
        const token = localStorage.getItem("token");

        try {
            const res = await fetch(`http://127.0.0.1:5000/api/tech/tickets/${ticketId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(patch),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setErr(data.error || "Failed to update ticket.");
                return;
            }

            await loadTickets();
        } catch {
            setErr("Network error while updating ticket.");
        }
    }
    
    async function unassignMe(ticketId) {
      setErr("");
      const token = localStorage.getItem("token");

      try {
        const res = await fetch(`http://127.0.0.1:5000/api/tech/tickets/${ticketId}/unassign`, {
          method: "PATCH", headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json().catch(() => ({}));
        if(!res.ok) {
          setErr(data.error || "Failed to unassign ticket");
          return;
        }

        await loadTickets();
        showTicketMsg(ticketId, "Unassigned from ticket. Couldn't hack it, huh?");
      } catch {
        setErr("Network error while unassigning ticket");
      }
    }

  return (
    <div style={{ padding: 24, background: "#fafafa", minHeight: "100vh" }}>
      <h1 style={{ textAlign: "center", marginTop: 0 }}>Tech Portal</h1>
      {err && <p style={{ color: "crimson", textAlign: "center" }}>{err}</p>}

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        {/* Welcome bubble */}
        <div style={{ width: 450, border: "1px solid #ddd", padding: 12,
            borderRadius: 12, background: "#fff", position: "sticky", top: 16 }}>
          <p><strong>Welcome, {username}!</strong></p>

          <button onClick={loadTickets} style={{
            width: "100%", padding: "10px 12px", borderRadius: 8, border: "none",
            background: "#1976d2", color: "#fff", cursor: "pointer", fontWeight: 600}}>
                Load Tickets
          </button>

          {/* Log out */}
          <button onClick={handleLogout} style={{
            marginTop: 16, width: "100%", padding: "8px 12px", borderRadius: 8,
            border: "1px solid #ccc", background: "#f30f0f", cursor: "pointer", color: "#fff" }}>
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
                All information associated with this account will be lost. If you still wish to
                proceed, please type "DELETE" to confirm.
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
          
        </div>

        {/* Tickets bubble */}
        <div style={{ flex: 1, border: "1px solid #ddd", borderRadius: 16,
            padding: 16, background: "#fff", boxShadow: "0 1px 8px rgba(0,0,0,0.06)"}}>
          <h2 style={{ marginTop: 0 }}>All Tickets</h2>

          {loading && <p>Loading...</p>}
          {!loading && items.length === 0 && <p>No tickets found.</p>}

          {items.map((t) => {
            const progress = Number.isFinite(Number(t.progress)) ? Number(t.progress) : 0;
            const canEdit = t.assigned_to === myId;

            return (
              <div key={t.id} style={{ border: "1px solid #ddd", padding: 12,
                  marginBottom: 12, borderRadius: 12, background: "#fff"}}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <strong>{t.title}</strong>
                  <span style={{ opacity: 0.8 }}>User: <strong>{t.created_by_username}</strong></span>
                </div>

                <div style={{ marginTop: 6 }}>Status: {t.status}</div>
                <div style={{ marginTop: 6 }}>
                  Assigned to: {t.assigned_to_username || "Unassigned"}
                </div>

                <div style={{ marginTop: 10, display: "flex", gap: 12, alignItems: "center" }}>
                  <div>
                    <label>Priority</label><br/>
                    <select value={t.priority} disabled={!canEdit}
                      onChange={(e) => updateTicket(t.id, { priority: e.target.value })}
                      style={{ padding: 6 }}>
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                    </select>
                  </div>

                  <div style={{ flex: 1 }}>
                    <label>Progress: {progress}%</label>
                    <input type="range" min="0" max="100" value={progress} disabled={!canEdit}
                      onChange={(e) => updateTicket(t.id, { progress: Number(e.target.value) })}
                      style={{ width: "100%" }}/>
                    <div style={{ height: 10, border: "1px solid #ccc", marginTop: 6, width: "100%",
                        borderRadius: 999, overflow: "hidden",
                        background: "#f3f3f3"}}>
                      <div style={{ height: "100%", width: `${progress}%`, background: "#4caf50" }} />
                    </div>
                  </div>
                </div>

                {t.assigned_to == null && (
                  <button onClick={() => assignToMe(t.id)} style={{
                      marginTop: 10, padding: "8px 12px", borderRadius: 8, border: "none",
                      background: "#1976d2", color: "#fff", cursor: "pointer",
                      fontWeight: 600}}>Assign to me</button>
                )}
                
                {canEdit && (<button onClick={() => unassignMe(t.id)} style={{
                  marginTop: 10, padding: "8px 12px", borderRadius: 8, border: "none",
                  background: "#e60909", color: "#fff", cursor: "pointer",
                  fontWeight: 600}}>Unassign me</button>
                )}

                {/* Ticket details buttons */}
                <div style={{ marginTop: 10, display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {!expanded.has(t.id) ? (
                    <button onClick={() => showDetails(t.id)} style={{
                      padding: "8px 12px", borderRadius: 8, border: "none", color: "#fff",
                      background: "#00ffee", cursor: "pointer", fontWeight: 600
                    }}>Show Ticket Details</button>
                  ) : (
                    <button onClick={() => hideDetails(t.id)} style={{
                      padding: "8px 12px", borderRadius: 8, border: "none", color: "#000000",
                      background: "#fdfd00", cursor: "pointer", fontWeight: 600
                    }}>Hide Ticket Details</button>
                  )}
                </div>

                {/* Ticket details */}
                {expanded.has(t.id) && (
                  <div style={{ marginTop: 10, padding: 10, borderRadius: 10, 
                    background: "#fafafa", border: "1px solid #eee"
                  }}>
                    <div style={{ marginBottom: 8, }}>
                      <strong>Description</strong>
                      <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>
                        {t.description}
                      </div>
                    </div>

                    <div style={{ opacity: 0.85 }}>
                      <strong>Created on: </strong>
                      {t.created_at ? new Date(t.created_at).toLocaleString() : "Unknown" }
                    </div>
                  </div>
                )}

                {ticketMsg[t.id] && (
                  <p style={{ color: "green", marginTop: 8 }}>
                    {ticketMsg[t.id]}
                  </p>
                )}

                {!loggingOut && t.assigned_to != null && !canEdit && (
                  <p style={{ marginTop: 10, color: "#666" }}>
                    Read-only! Ticket is assigned to another technician.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TechHome;