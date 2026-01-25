import { useEffect, useState } from "react";

export default function TicketNotes({ticketId, role}) {
    const token = localStorage.getItem("token");

    const [notes, setNotes] = useState([]);
    const [text, setText] = useState("");
    const [isInternal, setIsInternal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [posting, setPosting] = useState(false);

    useEffect(() => {
  let cancelled = false;

  async function run() {
    setErr("");
    setLoading(true);

    try {
      const res = await fetch(`http://127.0.0.1:5000/api/tickets/${ticketId}/notes`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (!cancelled) setErr(data.error || "Failed to load notes");
        return;
      }

      if (!cancelled) setNotes(data.items || []);
    } catch {
      if (!cancelled) setErr("Network error loading notes");
    } finally {
      if (!cancelled) setLoading(false);
    }
  }

  run();
  return () => {
    cancelled = true;
  };
}, [ticketId, token]);

    async function postNote() {
        setErr("");
        const msg = text.trim();
        if (msg.length < 2) {
            setErr("Note too short");
            return;
        }

        setPosting(true);

        try {
            const res = await fetch(`http://127.0.0.1:5000/api/tickets/${ticketId}/notes`, {
                method: "POST", headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
            body: JSON.stringify({ note: msg, is_internal: role === "tech" ? isInternal : false })
        });
        
        const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setErr(data.error || "Failed to post note");
                return;
            }

            // append new note
            if (data.note) setNotes((prev) => [...prev, data.note]);
            setText("");
            setIsInternal(false);
        } catch {
            setErr("Network error posting note");
        } finally {
            setPosting(false);
        }
    }

    return (
        <div style={{ marginTop: 14 }}>
            <h3 style={{ margin: "10px 0" }}>Conversation</h3>

            {loading  && <p>Loading notes ...</p>}
            {err && <p style={{ color: "crimson" }}>{err}</p>}

            {!loading && notes.length === 0 && (
                <p style={{ opacity: "0.8" }}>No messages yet</p>
            )}

            {notes.map((n) => (
                <div key={n.id} style={{
                    border: "1px solid #eee", padding: 10, borderRadius: 10,
                    marginBottom: 10, background: n.is_internal ? "#fff7e6" : "#fafafa"
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ fontWeight: 700 }}>
                            {n.author_username}{" "}
                            <span style={{ fontWeight: 400, opacity: 0.7 }}>
                                ({n.author_role})
                            </span>
                            {n.is_internal && (
                                <span style={{ marginLeft: 8, fontWeight: 700, color: "#b26a00" }}>
                                    INTERNAL
                                </span>
                            )}
                        </div>

                        <div style={{ opacity: 0.75, fontSize: 12 }}>
                            {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
                        </div>
                    </div>

                    <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{n.note}</div>
                </div>
            ))}

            {/* Composer */}
            <div style={{ marginTop: 10 }}>
                <textarea value={text} onChange={(e) => setText(e.target.value)}
                rows={3} style={{
                    width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
                    placeholder="Write a message" disabled={posting}
                />

                {role === "tech" && (
                    <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                        <input 
                            type="checkbox" checked={isInternal} 
                            onChange={(e) => setIsInternal(e.target.checked)}
                            disabled={posting}
                        />
                        Internal note (tech only)
                    </label>
                    )}

                    <button onClick={postNote} disabled={posting} style={{
                        marginTop: 10, padding: "10px 12px", border: "none", borderRadius: 8,
                        background: "#1976d2", color: "#fff", cursor: "pointer",
                        fontWeight: 600, opacity: posting ? 0.7 : 1
                    }}>
                        {posting ? "Posting ..." : "Post message"}
                    </button>
            </div>
        </div>
    );
}